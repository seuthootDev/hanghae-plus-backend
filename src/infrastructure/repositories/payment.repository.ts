import { Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentRepositoryInterface } from '../../application/interfaces/repositories/payment-repository.interface';

@Injectable()
export class PaymentRepository implements PaymentRepositoryInterface {
  private payments: Map<number, Payment> = new Map();
  private nextPaymentId = 1;

  constructor() {
    // Mock 데이터 초기화
    const payment1 = new Payment(
      this.nextPaymentId++,
      100, // orderId
      1, // userId
      6000, // totalAmount
      600, // discountAmount
      5400, // finalAmount
      true, // couponUsed
      'SUCCESS', // status
      new Date() // paidAt
    );

    const payment2 = new Payment(
      this.nextPaymentId++,
      101, // orderId
      2, // userId
      12000, // totalAmount
      0, // discountAmount
      12000, // finalAmount
      false, // couponUsed
      'SUCCESS', // status
      new Date() // paidAt
    );

    this.payments.set(payment1.id, payment1);
    this.payments.set(payment2.id, payment2);
  }

  async findById(id: number): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async save(payment: Payment): Promise<Payment> {
    if (!payment.id) {
      // 새 결제인 경우 ID 할당
      const newPayment = new Payment(
        this.nextPaymentId++,
        payment.orderId,
        payment.userId,
        payment.totalAmount,
        payment.discountAmount,
        payment.finalAmount,
        payment.couponUsed,
        payment.status,
        payment.paidAt
      );
      this.payments.set(newPayment.id, newPayment);
      return newPayment;
    } else {
      // 기존 결제 업데이트
      this.payments.set(payment.id, payment);
      return payment;
    }
  }

  async findByOrderId(orderId: number): Promise<Payment | null> {
    return Array.from(this.payments.values()).find(payment => payment.orderId === orderId) || null;
  }
} 