import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { PaymentsServiceInterface } from '../../../src/application/interfaces/services/payments-service.interface';
import { OrderRepositoryInterface } from '../../../src/application/interfaces/repositories/order-repository.interface';
import { UserRepositoryInterface } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { ProductRepositoryInterface } from '../../../src/application/interfaces/repositories/product-repository.interface';
import { PaymentValidationService } from '../../../src/domain/services/payment-validation.service';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { Order } from '../../../src/domain/entities/order.entity';
import { User } from '../../../src/domain/entities/user.entity';
import { Payment } from '../../../src/domain/entities/payment.entity';
import { Product } from '../../../src/domain/entities/product.entity';
import { ProcessPaymentDto } from '../../../src/presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../src/presentation/dto/paymentsDTO/payment-response.dto';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentsService: jest.Mocked<PaymentsServiceInterface>;
  let mockOrderRepository: jest.Mocked<OrderRepositoryInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockProductRepository: jest.Mocked<ProductRepositoryInterface>;
  let mockPaymentValidationService: jest.Mocked<PaymentValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;

  beforeEach(async () => {
    const mockPaymentsServiceProvider = {
      provide: 'PAYMENTS_SERVICE',
      useValue: {
        processPayment: jest.fn(),
      },
    };

    const mockOrderRepositoryProvider = {
      provide: 'ORDER_REPOSITORY',
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: 'USER_REPOSITORY',
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockProductRepositoryProvider = {
      provide: 'PRODUCT_REPOSITORY',
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockPaymentValidationServiceProvider = {
      provide: PaymentValidationService,
      useValue: {
        validateOrderExists: jest.fn(),
        validateUserExists: jest.fn(),
        validatePaymentPossible: jest.fn(),
      },
    };

    const mockUserValidationServiceProvider = {
      provide: UserValidationService,
      useValue: {
        validateUsePoints: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        mockPaymentsServiceProvider,
        mockOrderRepositoryProvider,
        mockUserRepositoryProvider,
        mockProductRepositoryProvider,
        mockPaymentValidationServiceProvider,
        mockUserValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    mockPaymentsService = module.get('PAYMENTS_SERVICE');
    mockOrderRepository = module.get('ORDER_REPOSITORY');
    mockUserRepository = module.get('USER_REPOSITORY');
    mockProductRepository = module.get('PRODUCT_REPOSITORY');
    mockPaymentValidationService = module.get(PaymentValidationService);
    mockUserValidationService = module.get(UserValidationService);
  });

  describe('execute', () => {
    it('결제 처리가 성공적으로 완료되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrderItems = [
        { productId: 1, quantity: 2, price: 10000 }
      ];
      const mockOrder = new Order(1, 1, mockOrderItems, 20000, 0, 20000, null, false, 'PENDING');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockPayment = new Payment(
        1,
        1,
        1,
        20000,
        0,
        20000,
        false,
        'SUCCESS',
        new Date()
      );
      const mockResponse: PaymentResponseDto = {
        paymentId: 1,
        orderId: 1,
        totalAmount: 20000,
        discountAmount: 0,
        finalAmount: 20000,
        couponUsed: false,
        status: 'SUCCESS',
        paidAt: new Date(),
      };

      // User와 Order 메서드 모킹
      mockUser.usePoints = jest.fn();
      mockOrder.updateStatus = jest.fn();

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockPaymentValidationService.validateOrderExists).toHaveBeenCalledWith(mockOrder);
      expect(mockPaymentValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
      expect(mockPaymentValidationService.validatePaymentPossible).toHaveBeenCalledWith(mockOrder, mockUser);
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith({
        orderId: 1,
        userId: 1,
        totalAmount: 20000,
        discountAmount: 0,
        finalAmount: 20000,
        couponUsed: false
      });
      expect(mockUserValidationService.validateUsePoints).toHaveBeenCalledWith(mockUser, 20000);
      expect(mockUser.usePoints).toHaveBeenCalledWith(20000);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('PAID');
      expect(mockOrderRepository.save).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockResponse);
    });

    it('쿠폰이 적용된 결제 처리가 성공적으로 완료되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 2,
      };

      const mockOrderItems = [
        { productId: 1, quantity: 1, price: 10000 }
      ];
      const mockOrder = new Order(2, 1, mockOrderItems, 10000, 1000, 9000, 1, true, 'PENDING');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockPayment = new Payment(
        2,
        2,
        1,
        10000,
        1000,
        9000,
        true,
        'SUCCESS',
        new Date()
      );
      const mockResponse: PaymentResponseDto = {
        paymentId: 2,
        orderId: 2,
        totalAmount: 10000,
        discountAmount: 1000,
        finalAmount: 9000,
        couponUsed: true,
        status: 'SUCCESS',
        paidAt: new Date(),
      };

      // User와 Order 메서드 모킹
      mockUser.usePoints = jest.fn();
      mockOrder.updateStatus = jest.fn();

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith({
        orderId: 2,
        userId: 1,
        totalAmount: 10000,
        discountAmount: 1000,
        finalAmount: 9000,
        couponUsed: true
      });
      expect(result).toEqual(mockResponse);
      expect(result.couponUsed).toBe(true);
      expect(result.discountAmount).toBe(1000);
    });

    it('서비스에서 예외가 발생하면 예외를 전파해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 999,
      };
      const errorMessage = '주문을 찾을 수 없습니다';
      
      mockOrderRepository.findById.mockResolvedValue(null);
      mockPaymentValidationService.validateOrderExists.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow(errorMessage);
    });

    it('존재하지 않는 주문에 대해 예외를 전파해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 999,
      };
      const errorMessage = '주문을 찾을 수 없습니다';
      
      mockOrderRepository.findById.mockResolvedValue(null);
      mockPaymentValidationService.validateOrderExists.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow(errorMessage);
    });

    describe('트랜잭션 동작 테스트', () => {
      it('@Transactional 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('transactional', method);

        // Assert
        expect(metadata).toBe(true);
      });

      it('주문 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        mockOrderRepository.findById.mockRejectedValue(new Error('Order not found'));

        // Act & Assert
        await expect(useCase.execute(processPaymentDto)).rejects.toThrow('Order not found');
        
        // 트랜잭션이 롤백되었으므로 다른 작업들이 호출되지 않아야 함
        expect(mockUserRepository.findById).not.toHaveBeenCalled();
        expect(mockPaymentsService.processPayment).not.toHaveBeenCalled();
      });

      it('사용자 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 2, price: 10000 }], 20000, 0, 20000, null, false, 'PENDING');
        mockOrderRepository.findById.mockResolvedValue(mockOrder);
        mockUserRepository.findById.mockRejectedValue(new Error('User not found'));

        // Act & Assert
        await expect(useCase.execute(processPaymentDto)).rejects.toThrow('User not found');
        
        // 주문 조회는 성공했지만 사용자 조회에서 실패하여 트랜잭션이 롤백되어야 함
        expect(mockOrderRepository.findById).toHaveBeenCalled();
        expect(mockPaymentsService.processPayment).not.toHaveBeenCalled();
      });

      it('결제 처리 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 2, price: 10000 }], 20000, 0, 20000, null, false, 'PENDING');
        const mockUser = new User(1, 'user@test.com', 'password', 50000);
        mockUser.usePoints = jest.fn();

        mockOrderRepository.findById.mockResolvedValue(mockOrder);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPaymentsService.processPayment.mockRejectedValue(new Error('Payment processing failed'));

        // Act & Assert
        await expect(useCase.execute(processPaymentDto)).rejects.toThrow('Payment processing failed');
        
        // 주문과 사용자 조회는 성공했지만 결제 처리에서 실패하여 트랜잭션이 롤백되어야 함
        expect(mockOrderRepository.findById).toHaveBeenCalled();
        expect(mockUserRepository.findById).toHaveBeenCalled();
      });

      it('결제 실패 시 재고가 반환되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 2, price: 10000 }], 20000, 0, 20000, null, false, 'PENDING');
        const mockUser = new User(1, 'user@test.com', 'password', 50000);
        const mockProduct = new Product(1, '상품1', 10000, 8, '음료'); // 재고 8개 (이미 2개 차감된 상태)
        mockProduct.increaseStock = jest.fn();

        mockOrderRepository.findById.mockResolvedValue(mockOrder);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockProductRepository.findById.mockResolvedValue(mockProduct);
        mockPaymentsService.processPayment.mockRejectedValue(new Error('Payment failed'));

        // Act & Assert
        await expect(useCase.execute(processPaymentDto)).rejects.toThrow('Payment failed');
        
        // 재고 반환 검증
        expect(mockProduct.increaseStock).toHaveBeenCalledWith(2);
        expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
      });

      it('포인트 차감 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 2, price: 10000 }], 20000, 0, 20000, null, false, 'PENDING');
        const mockUser = new User(1, 'user@test.com', 'password', 50000);
        const mockPayment = new Payment(1, 1, 1, 20000, 0, 20000, false, 'SUCCESS', new Date());

        mockUser.usePoints = jest.fn().mockImplementation(() => {
          throw new Error('Insufficient points');
        });
        mockOrder.updateStatus = jest.fn();

        mockOrderRepository.findById.mockResolvedValue(mockOrder);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPaymentsService.processPayment.mockResolvedValue(mockPayment);

        // Act & Assert
        await expect(useCase.execute(processPaymentDto)).rejects.toThrow('Insufficient points');
        
        // 주문과 사용자 조회, 결제 처리는 성공했지만 포인트 차감에서 실패하여 트랜잭션이 롤백되어야 함
        expect(mockOrderRepository.findById).toHaveBeenCalled();
        expect(mockUserRepository.findById).toHaveBeenCalled();
        expect(mockPaymentsService.processPayment).toHaveBeenCalled();
        expect(mockUser.usePoints).toHaveBeenCalled();
        expect(mockUserRepository.save).not.toHaveBeenCalled();
        expect(mockOrder.updateStatus).not.toHaveBeenCalled();
        expect(mockOrderRepository.save).not.toHaveBeenCalled();
      });

      it('모든 단계가 성공하면 트랜잭션이 커밋되어야 한다', async () => {
        // Arrange
        const processPaymentDto: ProcessPaymentDto = {
          orderId: 1,
        };

        const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 2, price: 10000 }], 20000, 0, 20000, null, false, 'PENDING');
        const mockUser = new User(1, 'user@test.com', 'password', 50000);
        const mockPayment = new Payment(1, 1, 1, 20000, 0, 20000, false, 'SUCCESS', new Date());
        const mockResponse: PaymentResponseDto = {
          paymentId: 1,
          orderId: 1,
          totalAmount: 20000,
          discountAmount: 0,
          finalAmount: 20000,
          couponUsed: false,
          status: 'SUCCESS',
          paidAt: new Date(),
        };

        mockUser.usePoints = jest.fn();
        mockOrder.updateStatus = jest.fn();

        mockOrderRepository.findById.mockResolvedValue(mockOrder);
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockPaymentsService.processPayment.mockResolvedValue(mockPayment);

        // Act
        const result = await useCase.execute(processPaymentDto);

        // Assert - 모든 단계가 성공적으로 실행되어야 함
        expect(mockOrderRepository.findById).toHaveBeenCalled();
        expect(mockUserRepository.findById).toHaveBeenCalled();
        expect(mockPaymentsService.processPayment).toHaveBeenCalled();
        expect(mockUser.usePoints).toHaveBeenCalled();
        expect(mockUserRepository.save).toHaveBeenCalled();
        expect(mockOrder.updateStatus).toHaveBeenCalled();
        expect(mockOrderRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
      });
    });
  });
}); 