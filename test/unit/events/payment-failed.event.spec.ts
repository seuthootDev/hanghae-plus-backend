import { PaymentFailedEvent } from '../../../src/domain/events/payment-failed.event';

describe('PaymentFailedEvent', () => {
  const mockPaymentData = {
    orderId: '123',
    userId: '456',
    items: [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    couponId: 789,
    failureReason: '카드 한도 초과',
    failedAt: new Date('2024-01-01T10:00:00Z'),
    isTimeout: false
  };

  describe('생성', () => {
    it('올바른 데이터로 이벤트를 생성할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(event.orderId).toBe(mockPaymentData.orderId);
      expect(event.userId).toBe(mockPaymentData.userId);
      expect(event.items).toEqual(mockPaymentData.items);
      expect(event.couponId).toBe(mockPaymentData.couponId);
      expect(event.failureReason).toBe(mockPaymentData.failureReason);
      expect(event.failedAt).toBe(mockPaymentData.failedAt);
      expect(event.isTimeout).toBe(mockPaymentData.isTimeout);
    });

    it('쿠폰을 사용하지 않은 경우에도 이벤트를 생성할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        null, // couponId가 null
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(event.couponId).toBeNull();
    });

    it('시간 초과로 인한 실패를 표현할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '결제 시간 초과 (10분)',
        mockPaymentData.failedAt,
        true // isTimeout = true
      );

      expect(event.isTimeout).toBe(true);
      expect(event.failureReason).toBe('결제 시간 초과 (10분)');
    });
  });

  describe('데이터 검증', () => {
    it('주문 ID가 문자열이어야 한다', () => {
      const event = new PaymentFailedEvent(
        '123',
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(typeof event.orderId).toBe('string');
      expect(event.orderId).toBe('123');
    });

    it('사용자 ID가 문자열이어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        '456',
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(typeof event.userId).toBe('string');
      expect(event.userId).toBe('456');
    });

    it('상품 목록이 배열이어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(Array.isArray(event.items)).toBe(true);
      expect(event.items).toHaveLength(2);
    });

    it('실패 시간이 Date 객체여야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        mockPaymentData.isTimeout
      );

      expect(event.failedAt).toBeInstanceOf(Date);
    });

    it('isTimeout이 boolean이어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        mockPaymentData.failureReason,
        mockPaymentData.failedAt,
        true
      );

      expect(typeof event.isTimeout).toBe('boolean');
      expect(event.isTimeout).toBe(true);
    });
  });

  describe('실패 시나리오', () => {
    it('일반 결제 실패 (카드 오류 등)를 표현할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '카드 한도 초과',
        mockPaymentData.failedAt,
        false // isTimeout = false
      );

      expect(event.isTimeout).toBe(false);
      expect(event.failureReason).toBe('카드 한도 초과');
    });

    it('시간 초과로 인한 실패를 표현할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '결제 시간 초과 (10분)',
        mockPaymentData.failedAt,
        true // isTimeout = true
      );

      expect(event.isTimeout).toBe(true);
      expect(event.failureReason).toBe('결제 시간 초과 (10분)');
    });

    it('포인트 부족으로 인한 실패를 표현할 수 있어야 한다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '포인트 부족',
        mockPaymentData.failedAt,
        false // isTimeout = false
      );

      expect(event.isTimeout).toBe(false);
      expect(event.failureReason).toBe('포인트 부족');
    });
  });

  describe('보상 트랜잭션 필요성 판단', () => {
    it('시간 초과인 경우 보상 트랜잭션이 필요하다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '결제 시간 초과 (10분)',
        mockPaymentData.failedAt,
        true // isTimeout = true
      );

      expect(event.isTimeout).toBe(true);
      // isTimeout이 true인 경우 보상 트랜잭션 필요
    });

    it('일반 결제 실패인 경우 보상 트랜잭션이 불필요하다', () => {
      const event = new PaymentFailedEvent(
        mockPaymentData.orderId,
        mockPaymentData.userId,
        mockPaymentData.items,
        mockPaymentData.couponId,
        '카드 한도 초과',
        mockPaymentData.failedAt,
        false // isTimeout = false
      );

      expect(event.isTimeout).toBe(false);
      // isTimeout이 false인 경우 보상 트랜잭션 불필요
    });
  });
});
