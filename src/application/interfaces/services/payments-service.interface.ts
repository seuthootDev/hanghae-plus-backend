import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';

export const PAYMENTS_SERVICE = 'PAYMENTS_SERVICE';

export interface PaymentsServiceInterface {
  processPayment(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto>;
} 