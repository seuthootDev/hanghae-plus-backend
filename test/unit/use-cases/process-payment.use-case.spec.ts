import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../../src/application/interfaces/services/payments-service.interface';
import { PaymentPresenterInterface, PAYMENT_PRESENTER } from '../../../src/application/interfaces/presenters/payment-presenter.interface';
import { ProcessPaymentDto } from '../../../src/presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../src/presentation/dto/paymentsDTO/payment-response.dto';
import { Payment } from '../../../src/domain/entities/payment.entity';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentsService: jest.Mocked<PaymentsServiceInterface>;
  let mockPaymentPresenter: jest.Mocked<PaymentPresenterInterface>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        mockPaymentsServiceProvider,
        mockPaymentPresenterProvider,
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    mockPaymentsService = module.get(PAYMENTS_SERVICE);
    mockPaymentPresenter = module.get(PAYMENT_PRESENTER);
  });

  describe('execute', () => {
    it('결제 처리가 성공적으로 완료되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 1,
      };
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

      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);
      mockPaymentPresenter.presentPayment.mockReturnValue(mockResponse);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(processPaymentDto);
      expect(mockPaymentPresenter.presentPayment).toHaveBeenCalledWith(mockPayment);
      expect(result).toEqual(mockResponse);
      expect(result.paymentId).toBe(1);
      expect(result.status).toBe('SUCCESS');
    });

    it('쿠폰이 적용된 결제 처리가 성공적으로 완료되어야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 2,
      };
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

      mockPaymentsService.processPayment.mockResolvedValue(mockPayment);
      mockPaymentPresenter.presentPayment.mockReturnValue(mockResponse);

      // when
      const result = await useCase.execute(processPaymentDto);

      // then
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(processPaymentDto);
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
      
      mockPaymentsService.processPayment.mockRejectedValue(new Error(errorMessage));

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow(errorMessage);
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(processPaymentDto);
    });

    it('존재하지 않는 주문에 대해 예외를 전파해야 한다', async () => {
      // given
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 999,
      };
      const errorMessage = '주문을 찾을 수 없습니다';
      
      mockPaymentsService.processPayment.mockRejectedValue(new Error(errorMessage));

      // when & then
      await expect(useCase.execute(processPaymentDto)).rejects.toThrow(errorMessage);
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(processPaymentDto);
    });
  });
}); 