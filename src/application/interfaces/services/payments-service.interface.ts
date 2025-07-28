import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';
import { Payment } from '../../../domain/entities/payment.entity';

export const PAYMENTS_SERVICE = 'PAYMENTS_SERVICE';

export interface PaymentsServiceInterface {
  processPayment(paymentData: {
    orderId: number;
    userId: number;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponUsed: boolean;
  }): Promise<Payment>;
  findById(paymentId: number): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
} 