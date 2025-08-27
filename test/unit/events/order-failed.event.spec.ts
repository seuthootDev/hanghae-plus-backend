import { OrderFailedEvent } from '../../../src/domain/events/order-failed.event';

describe('OrderFailedEvent', () => {
  const mockOrderData = {
    orderId: '123',
    userId: '456',
    items: [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    couponId: 789,
    failureReason: '재고 부족',
    failedAt: new Date('2024-01-01T10:00:00Z')
  };

  describe('생성', () => {
    it('올바른 데이터로 이벤트를 생성할 수 있어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(event.orderId).toBe(mockOrderData.orderId);
      expect(event.userId).toBe(mockOrderData.userId);
      expect(event.items).toEqual(mockOrderData.items);
      expect(event.couponId).toBe(mockOrderData.couponId);
      expect(event.failureReason).toBe(mockOrderData.failureReason);
      expect(event.failedAt).toBe(mockOrderData.failedAt);
    });

    it('쿠폰을 사용하지 않은 경우에도 이벤트를 생성할 수 있어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        null, // couponId가 null
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(event.couponId).toBeNull();
    });

    it('실패 이유가 문자열이어야 한다', () => {
      const failureReason = '포인트 부족';
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        failureReason,
        mockOrderData.failedAt
      );

      expect(typeof event.failureReason).toBe('string');
      expect(event.failureReason).toBe(failureReason);
    });
  });

  describe('데이터 검증', () => {
    it('주문 ID가 문자열이어야 한다', () => {
      const event = new OrderFailedEvent(
        '123',
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(typeof event.orderId).toBe('string');
      expect(event.orderId).toBe('123');
    });

    it('사용자 ID가 문자열이어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        '456',
        mockOrderData.items,
        mockOrderData.couponId,
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(typeof event.userId).toBe('string');
      expect(event.userId).toBe('456');
    });

    it('상품 목록이 배열이어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(Array.isArray(event.items)).toBe(true);
      expect(event.items).toHaveLength(2);
    });

    it('실패 시간이 Date 객체여야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        mockOrderData.failureReason,
        mockOrderData.failedAt
      );

      expect(event.failedAt).toBeInstanceOf(Date);
    });
  });

  describe('실패 시나리오', () => {
    it('재고 부족으로 인한 실패를 표현할 수 있어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        '재고 부족',
        mockOrderData.failedAt
      );

      expect(event.failureReason).toBe('재고 부족');
    });

    it('쿠폰 유효성 검증 실패를 표현할 수 있어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        '쿠폰 유효성 검증 실패',
        mockOrderData.failedAt
      );

      expect(event.failureReason).toBe('쿠폰 유효성 검증 실패');
    });

    it('사용자 검증 실패를 표현할 수 있어야 한다', () => {
      const event = new OrderFailedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.couponId,
        '사용자 검증 실패',
        mockOrderData.failedAt
      );

      expect(event.failureReason).toBe('사용자 검증 실패');
    });
  });
});
