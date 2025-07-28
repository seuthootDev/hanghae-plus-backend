import { Payment } from '../../../domain/entities/payment.entity';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';

export const PAYMENT_PRESENTER = 'PAYMENT_PRESENTER';

export interface PaymentPresenterInterface {
  presentPayment(payment: Payment): PaymentResponseDto;
  presentPaymentList(payments: Payment[]): PaymentResponseDto[];
} 