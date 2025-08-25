import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../../src/application/interfaces/services/payment-service.interface';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../../src/application/interfaces/services/order-service.interface';
import { UsersServiceInterface, USERS_SERVICE } from '../../../src/application/interfaces/services/user-service.interface';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
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
  let mockOrdersService: jest.Mocked<OrdersServiceInterface>;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockPaymentValidationService: jest.Mocked<PaymentValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;

  beforeEach(async () => {
    const mockPaymentsServiceProvider = {
      provide: PAYMENTS_SERVICE,
      useValue: {
        processPayment: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        findByOrderId: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

    const mockOrdersServiceProvider = {
      provide: ORDERS_SERVICE,
      useValue: {
        createOrder: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateOrderStatus: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

    const mockUsersServiceProvider = {
      provide: USERS_SERVICE,
      useValue: {
        chargePoints: jest.fn(),
        getUserPoints: jest.fn(),
        validateUser: jest.fn(),
        usePoints: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockProductsServiceProvider = {
      provide: PRODUCTS_SERVICE,
      useValue: {
        getProducts: jest.fn(),
        getTopSellers: jest.fn(),
        validateAndReserveProducts: jest.fn(),
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

    const mockEventBusProvider = {
      provide: 'EVENT_BUS',
      useValue: {
        publish: jest.fn(),
        subscribe: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        mockPaymentsServiceProvider,
        mockOrdersServiceProvider,
        mockUsersServiceProvider,
        mockProductsServiceProvider,
        mockPaymentValidationServiceProvider,
        mockUserValidationServiceProvider,
        mockEventBusProvider,
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    mockPaymentsService = module.get('PAYMENTS_SERVICE');
    mockOrdersService = module.get('ORDERS_SERVICE');
    mockUsersService = module.get('USERS_SERVICE');
    mockProductsService = module.get('PRODUCTS_SERVICE');
    mockPaymentValidationService = module.get(PaymentValidationService);
    mockUserValidationService = module.get(UserValidationService);
  });

  describe('execute', () => {
    it('결제 처리가 성공적으로 완료되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        0,
        20000,
        null,
        false,
        'PENDING'
      );

      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockPayment = new Payment(1, 1, 1, 20000, 0, 20000, false, 'COMPLETED', new Date());

      // 서비스 모킹
      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);
      mockUsersService.usePoints.mockResolvedValue(mockUser);
      mockOrdersService.updateOrderStatus.mockResolvedValue(mockOrder);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockOrdersService.findById).toHaveBeenCalledWith(1);
      expect(mockPaymentValidationService.validateOrderExists).toHaveBeenCalledWith(mockOrder);
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(1);
      expect(mockPaymentValidationService.validatePaymentPossible).toHaveBeenCalledWith(mockOrder, mockUser);
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith({
        orderId: 1,
        userId: 1,
        totalAmount: 20000,
        discountAmount: 0,
        finalAmount: 20000,
        couponUsed: false,
      });
      expect(mockUsersService.usePoints).toHaveBeenCalledWith(1, 20000);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(1, 'PAID');

      expect(result).toEqual({
        paymentId: 1,
        orderId: 1,
        totalAmount: 20000,
        discountAmount: 0,
        finalAmount: 20000,
        couponUsed: false,
        status: 'COMPLETED',
        paidAt: mockPayment.paidAt,
      });
    });

    it('주문이 존재하지 않으면 에러가 발생해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 999,
      };

      mockOrdersService.findById.mockResolvedValue(null);

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow('주문을 찾을 수 없습니다.');
    });

    it('사용자가 존재하지 않으면 에러가 발생해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        0,
        20000,
        null,
        false,
        'PENDING'
      );

      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockRejectedValue(new Error('사용자를 찾을 수 없습니다.'));

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });

    it('포인트가 부족하면 에러가 발생해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        0,
        20000,
        null,
        false,
        'PENDING'
      );

      const mockUser = new User(1, 'user@test.com', 'password', 10000); // 포인트 부족

      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockUsersService.usePoints.mockRejectedValue(new Error('포인트가 부족합니다.'));

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow('포인트가 부족합니다.');
    });

    it('이미 처리된 주문이면 에러가 발생해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        0,
        20000,
        null,
        false,
        'PAID' // 이미 결제됨
      );

      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockPaymentValidationService.validatePaymentPossible.mockImplementation(() => {
        throw new Error('이미 처리된 주문입니다.');
      });

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow('이미 처리된 주문입니다.');
    });

    it('결제 처리 실패 시 재고가 반환되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        0,
        20000,
        null,
        false,
        'PENDING'
      );

      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.increaseStock = jest.fn();

      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockPaymentsService.processPayment.mockRejectedValue(new Error('결제 처리 실패'));
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockProductsService.save.mockResolvedValue(mockProduct);

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow('결제 처리 실패');
      expect(mockProductsService.findById).toHaveBeenCalledWith(1);
      expect(mockProductsService.save).toHaveBeenCalledWith(mockProduct);
    });

    it('쿠폰이 적용된 주문도 처리할 수 있어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };

      const mockOrder = new Order(
        1,
        1,
        [{ productId: 1, quantity: 2, price: 10000 }],
        20000,
        2000, // 할인 적용
        18000, // 최종 금액
        1, // 쿠폰 ID
        true, // 쿠폰 사용
        'PENDING'
      );

      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockPayment = new Payment(1, 1, 1, 20000, 2000, 18000, true, 'COMPLETED', new Date());

      mockOrdersService.findById.mockResolvedValue(mockOrder);
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);
      mockUsersService.usePoints.mockResolvedValue(mockUser);
      mockOrdersService.updateOrderStatus.mockResolvedValue(mockOrder);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith({
        orderId: 1,
        userId: 1,
        totalAmount: 20000,
        discountAmount: 2000,
        finalAmount: 18000,
        couponUsed: true,
      });
      expect(mockUsersService.usePoints).toHaveBeenCalledWith(1, 18000);

      expect(result).toEqual({
        paymentId: 1,
        orderId: 1,
        totalAmount: 20000,
        discountAmount: 2000,
        finalAmount: 18000,
        couponUsed: true,
        status: 'COMPLETED',
        paidAt: mockPayment.paidAt,
      });
    });
  });
}); 