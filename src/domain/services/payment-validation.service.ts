import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';

export const PAYMENT_VALIDATION_SERVICE = 'PAYMENT_VALIDATION_SERVICE';

export class PaymentValidationService {
  
  /**
   * 주문 존재 여부 검증
   */
  validateOrderExists(order: Order | null): void {
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
  }

  /**
   * 사용자 존재 여부 검증
   */
  validateUserExists(user: User | null): void {
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
  }

  /**
   * 결제 가능 여부 검증
   */
  validatePaymentPossible(order: Order, user: User): void {
    if (order.status !== 'PENDING') {
      throw new Error('이미 처리된 주문입니다.');
    }
    
    if (!user.hasEnoughPoints(order.finalAmount)) {
      throw new Error('포인트가 부족합니다.');
    }
  }

  /**
   * 결제 금액 검증
   */
  validatePaymentAmount(payment: Payment): void {
    if (payment.finalAmount <= 0) {
      throw new Error('결제 금액은 0원보다 커야 합니다.');
    }
    
    if (payment.finalAmount > payment.totalAmount) {
      throw new Error('최종 금액은 총 금액을 초과할 수 없습니다.');
    }
  }

  /**
   * 결제 상태 검증
   */
  validatePaymentStatus(payment: Payment): void {
    if (payment.status !== 'PENDING') {
      throw new Error('이미 처리된 결제입니다.');
    }
  }

  /**
   * 전체 결제 검증
   */
  validatePayment(
    order: Order | null,
    user: User | null,
    payment: Payment
  ): void {
    this.validateOrderExists(order);
    this.validateUserExists(user);
    this.validatePaymentPossible(order!, user!);
    this.validatePaymentAmount(payment);
    this.validatePaymentStatus(payment);
  }
} 