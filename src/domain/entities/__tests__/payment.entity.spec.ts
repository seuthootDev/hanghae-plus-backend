import { Payment } from '../payment.entity';

describe('Payment Entity', () => {
  let pendingPayment: Payment;
  let successfulPayment: Payment;
  let cancelledPayment: Payment;

  beforeEach(() => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000); // 1일 전

    pendingPayment = new Payment(1, 1, 1, 10000, 2000, 8000, true, 'PENDING', now);
    successfulPayment = new Payment(2, 2, 1, 15000, 3000, 12000, false, 'SUCCESS', pastDate);
    cancelledPayment = new Payment(3, 3, 1, 20000, 0, 20000, false, 'CANCELLED', now);
  });

  describe('getters', () => {
    it('totalAmount getter가 총 금액을 반환해야 한다', () => {
      expect(pendingPayment.totalAmount).toBe(10000);
    });

    it('discountAmount getter가 할인 금액을 반환해야 한다', () => {
      expect(pendingPayment.discountAmount).toBe(2000);
    });

    it('finalAmount getter가 최종 금액을 반환해야 한다', () => {
      expect(pendingPayment.finalAmount).toBe(8000);
    });

    it('couponUsed getter가 쿠폰 사용 여부를 반환해야 한다', () => {
      expect(pendingPayment.couponUsed).toBe(true);
      expect(successfulPayment.couponUsed).toBe(false);
    });

    it('status getter가 결제 상태를 반환해야 한다', () => {
      expect(pendingPayment.status).toBe('PENDING');
      expect(successfulPayment.status).toBe('SUCCESS');
      expect(cancelledPayment.status).toBe('CANCELLED');
    });

    it('paidAt getter가 결제 시간을 반환해야 한다', () => {
      expect(pendingPayment.paidAt).toBeInstanceOf(Date);
      expect(successfulPayment.paidAt).toBeInstanceOf(Date);
    });
  });

  describe('processPayment', () => {
    it('대기 중인 결제를 성공적으로 처리해야 한다', () => {
      const initialStatus = pendingPayment.status;
      const initialPaidAt = pendingPayment.paidAt;

      pendingPayment.processPayment();

      expect(pendingPayment.status).toBe('SUCCESS');
      expect(pendingPayment.paidAt).not.toBe(initialPaidAt);
      expect(pendingPayment.paidAt).toBeInstanceOf(Date);
    });

    it('이미 처리된 결제를 다시 처리하면 에러를 던져야 한다', () => {
      expect(() => {
        successfulPayment.processPayment();
      }).toThrow('이미 처리된 결제입니다.');
    });

    it('취소된 결제를 처리하면 에러를 던져야 한다', () => {
      expect(() => {
        cancelledPayment.processPayment();
      }).toThrow('이미 처리된 결제입니다.');
    });
  });

  describe('cancelPayment', () => {
    it('성공한 결제를 취소할 수 있어야 한다', () => {
      expect(successfulPayment.status).toBe('SUCCESS');

      successfulPayment.cancelPayment();

      expect(successfulPayment.status).toBe('CANCELLED');
    });

    it('대기 중인 결제는 취소할 수 없어야 한다', () => {
      const initialStatus = pendingPayment.status;

      pendingPayment.cancelPayment();

      expect(pendingPayment.status).toBe(initialStatus);
    });

    it('이미 취소된 결제는 상태가 변경되지 않아야 한다', () => {
      const initialStatus = cancelledPayment.status;

      cancelledPayment.cancelPayment();

      expect(cancelledPayment.status).toBe(initialStatus);
    });
  });

  describe('isSuccessful', () => {
    it('성공한 결제는 true를 반환해야 한다', () => {
      expect(successfulPayment.isSuccessful()).toBe(true);
    });

    it('대기 중인 결제는 false를 반환해야 한다', () => {
      expect(pendingPayment.isSuccessful()).toBe(false);
    });

    it('취소된 결제는 false를 반환해야 한다', () => {
      expect(cancelledPayment.isSuccessful()).toBe(false);
    });
  });

  describe('isValid', () => {
    it('유효한 결제는 true를 반환해야 한다', () => {
      expect(pendingPayment.isValid()).toBe(true);
      expect(successfulPayment.isValid()).toBe(true);
    });

    it('최종 금액이 0 이하인 결제는 false를 반환해야 한다', () => {
      const invalidPayment = new Payment(4, 4, 1, 10000, 12000, -2000, true, 'PENDING', new Date());
      expect(invalidPayment.isValid()).toBe(false);
    });

    it('최종 금액이 0인 결제는 false를 반환해야 한다', () => {
      const zeroPayment = new Payment(5, 5, 1, 10000, 10000, 0, true, 'PENDING', new Date());
      expect(zeroPayment.isValid()).toBe(false);
    });

    it('최종 금액이 총 금액보다 큰 결제는 false를 반환해야 한다', () => {
      const invalidPayment = new Payment(6, 6, 1, 10000, -2000, 12000, true, 'PENDING', new Date());
      expect(invalidPayment.isValid()).toBe(false);
    });

    it('최종 금액이 총 금액과 같은 결제는 true를 반환해야 한다', () => {
      const validPayment = new Payment(7, 7, 1, 10000, 0, 10000, false, 'PENDING', new Date());
      expect(validPayment.isValid()).toBe(true);
    });
  });

  describe('payment scenarios', () => {
    it('쿠폰을 사용한 결제가 올바르게 처리되어야 한다', () => {
      expect(pendingPayment.couponUsed).toBe(true);
      expect(pendingPayment.totalAmount).toBe(10000);
      expect(pendingPayment.discountAmount).toBe(2000);
      expect(pendingPayment.finalAmount).toBe(8000);
    });

    it('쿠폰을 사용하지 않은 결제가 올바르게 처리되어야 한다', () => {
      expect(successfulPayment.couponUsed).toBe(false);
      expect(successfulPayment.totalAmount).toBe(15000);
      expect(successfulPayment.discountAmount).toBe(3000);
      expect(successfulPayment.finalAmount).toBe(12000);
    });

    it('할인이 없는 결제가 올바르게 처리되어야 한다', () => {
      expect(cancelledPayment.couponUsed).toBe(false);
      expect(cancelledPayment.totalAmount).toBe(20000);
      expect(cancelledPayment.discountAmount).toBe(0);
      expect(cancelledPayment.finalAmount).toBe(20000);
    });
  });

  describe('edge cases', () => {
    it('매우 큰 금액의 결제도 처리해야 한다', () => {
      const largePayment = new Payment(8, 8, 1, 1000000, 100000, 900000, false, 'PENDING', new Date());
      expect(largePayment.isValid()).toBe(true);
    });

    it('매우 작은 금액의 결제도 처리해야 한다', () => {
      const smallPayment = new Payment(9, 9, 1, 100, 10, 90, false, 'PENDING', new Date());
      expect(smallPayment.isValid()).toBe(true);
    });
  });
}); 