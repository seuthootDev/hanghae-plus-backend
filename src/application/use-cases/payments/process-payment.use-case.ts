import { Injectable, Inject } from '@nestjs/common';
import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../interfaces/services/payments-service.interface';
import { PaymentPresenterInterface, PAYMENT_PRESENTER } from '../../interfaces/presenters/payment-presenter.interface';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: PaymentsServiceInterface,
    @Inject(PAYMENT_PRESENTER)
    private readonly paymentPresenter: PaymentPresenterInterface
  ) {}

  async execute(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentsService.processPayment(processPaymentDto);
    return this.paymentPresenter.presentPayment(payment);
  }
} 