import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../../src/application/interfaces/services/payments-service.interface';
import { PaymentPresenterInterface, PAYMENT_PRESENTER } from '../../../src/application/interfaces/presenters/payment-presenter.interface';
import { OrderRepositoryInterface } from '../../../src/application/interfaces/repositories/order-repository.interface';
import { UserRepositoryInterface } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { PaymentValidationService } from '../../../src/domain/services/payment-validation.service';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { ProcessPaymentDto } from '../../../src/presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../src/presentation/dto/paymentsDTO/payment-response.dto';
import { Payment } from '../../../src/domain/entities/payment.entity';
import { Order } from '../../../src/domain/entities/order.entity';
import { User } from '../../../src/domain/entities/user.entity';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentsService: jest.Mocked<PaymentsServiceInterface>;
  let mockPaymentPresenter: jest.Mocked<PaymentPresenterInterface>;
  let mockOrderRepository: jest.Mocked<OrderRepositoryInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockPaymentValidationService: jest.Mocked<PaymentValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;

  beforeEach(async () => {
    const mockPaymentsServiceProvider = {
      provide: PAYMENTS_SERVICE,
      useValue: {
        processPayment: jest.fn(),
      },
    };

    const mockPaymentPresenterProvider = {
      provide: PAYMENT_PRESENTER,
      useValue: {
        presentPayment: jest.fn(),
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
        mockPaymentPresenterProvider,
        mockOrderRepositoryProvider,
        mockUserRepositoryProvider,
        mockPaymentValidationServiceProvider,
        mockUserValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    mockPaymentsService = module.get(PAYMENTS_SERVICE);
    mockPaymentPresenter = module.get(PAYMENT_PRESENTER);
    mockOrderRepository = module.get('ORDER_REPOSITORY');
    mockUserRepository = module.get('USER_REPOSITORY');
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
        { productId: 1, quantity: 1, price: 10000 }
      ];
      const mockOrder = new Order(1, 1, mockOrderItems, 10000, 0, 10000, false, 'PENDING');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockPayment = new Payment(
        1,
        1,
        1,
        10000,
        0,
        10000,
        false,
        'SUCCESS',
        new Date()
      );
      const mockResponse: PaymentResponseDto = {
        paymentId: 1,
        orderId: 1,
        totalAmount: 10000,
        discountAmount: 0,
        finalAmount: 10000,
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
      mockPaymentPresenter.presentPayment.mockReturnValue(mockResponse);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPaymentValidationService.validateOrderExists).toHaveBeenCalledWith(mockOrder);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPaymentValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
      expect(mockPaymentValidationService.validatePaymentPossible).toHaveBeenCalledWith(mockOrder, mockUser);
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith({
        orderId: 1,
        userId: 1,
        totalAmount: 10000,
        discountAmount: 0,
        finalAmount: 10000,
        couponUsed: false
      });
      expect(mockUserValidationService.validateUsePoints).toHaveBeenCalledWith(mockUser, 10000);
      expect(mockUser.usePoints).toHaveBeenCalledWith(10000);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('PAID');
      expect(mockOrderRepository.save).toHaveBeenCalledWith(mockOrder);
      expect(mockPaymentPresenter.presentPayment).toHaveBeenCalledWith(mockPayment);
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
      const mockOrder = new Order(2, 1, mockOrderItems, 10000, 1000, 9000, true, 'PENDING');
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
      mockPaymentPresenter.presentPayment.mockReturnValue(mockResponse);

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
      expect(mockPaymentPresenter.presentPayment).toHaveBeenCalledWith(mockPayment);
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
  });
}); 