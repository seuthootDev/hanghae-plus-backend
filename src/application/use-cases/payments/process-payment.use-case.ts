import { Injectable, Inject } from '@nestjs/common';
import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../interfaces/services/payments-service.interface';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: PaymentsServiceInterface
  ) {}

  async execute(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    return this.paymentsService.processPayment(processPaymentDto);
  }
} 