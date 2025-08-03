import { Payment } from '../../../domain/entities/payment.entity';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface PaymentRepositoryInterface {
  findById(id: number): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
  findByOrderId(orderId: number): Promise<Payment[]>;
  findByUserId(userId: number): Promise<Payment[]>;
} 