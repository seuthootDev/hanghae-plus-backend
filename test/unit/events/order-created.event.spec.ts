import { OrderCreatedEvent } from '../../../src/domain/events/order-created.event';

describe('OrderCreatedEvent', () => {
  const mockOrderData = {
    orderId: '123',
    userId: '456',
    items: [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    totalAmount: 40000,
    discountAmount: 5000,
    finalAmount: 35000,
    couponId: 789,
    couponUsed: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    expiresAt: new Date('2024-01-01T10:10:00Z') // 10분 후
  };

  describe('생성', () => {
    it('올바른 데이터로 이벤트를 생성할 수 있어야 한다', () => {
      const event = new OrderCreatedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        mockOrderData.couponId,
        mockOrderData.couponUsed,
        mockOrderData.createdAt,
        mockOrderData.expiresAt
      );

      expect(event.orderId).toBe(mockOrderData.orderId);
      expect(event.userId).toBe(mockOrderData.userId);
      expect(event.items).toEqual(mockOrderData.items);
      expect(event.totalAmount).toBe(mockOrderData.totalAmount);
      expect(event.discountAmount).toBe(mockOrderData.discountAmount);
      expect(event.finalAmount).toBe(mockOrderData.finalAmount);
      expect(event.couponId).toBe(mockOrderData.couponId);
      expect(event.couponUsed).toBe(mockOrderData.couponUsed);
      expect(event.createdAt).toBe(mockOrderData.createdAt);
      expect(event.expiresAt).toBe(mockOrderData.expiresAt);
    });

    it('쿠폰을 사용하지 않은 경우에도 이벤트를 생성할 수 있어야 한다', () => {
      const event = new OrderCreatedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        null, // couponId가 null
        false, // couponUsed가 false
        mockOrderData.createdAt,
        mockOrderData.expiresAt
      );

      expect(event.couponId).toBeNull();
      expect(event.couponUsed).toBe(false);
    });

    it('만료 시간이 생성 시간으로부터 10분 후여야 한다', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const expiresAt = new Date('2024-01-01T10:10:00Z');
      
      const event = new OrderCreatedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        mockOrderData.couponId,
        mockOrderData.couponUsed,
        createdAt,
        expiresAt
      );

      const timeDiff = expiresAt.getTime() - createdAt.getTime();
      expect(timeDiff).toBe(10 * 60 * 1000); // 10분 (밀리초)
    });
  });

  describe('데이터 검증', () => {
    it('주문 ID가 문자열이어야 한다', () => {
      const event = new OrderCreatedEvent(
        '123',
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        mockOrderData.couponId,
        mockOrderData.couponUsed,
        mockOrderData.createdAt,
        mockOrderData.expiresAt
      );

      expect(typeof event.orderId).toBe('string');
      expect(event.orderId).toBe('123');
    });

    it('사용자 ID가 문자열이어야 한다', () => {
      const event = new OrderCreatedEvent(
        mockOrderData.orderId,
        '456',
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        mockOrderData.couponId,
        mockOrderData.couponUsed,
        mockOrderData.createdAt,
        mockOrderData.expiresAt
      );

      expect(typeof event.userId).toBe('string');
      expect(event.userId).toBe('456');
    });

    it('상품 목록이 배열이어야 한다', () => {
      const event = new OrderCreatedEvent(
        mockOrderData.orderId,
        mockOrderData.userId,
        mockOrderData.items,
        mockOrderData.totalAmount,
        mockOrderData.discountAmount,
        mockOrderData.finalAmount,
        mockOrderData.couponId,
        mockOrderData.couponUsed,
        mockOrderData.createdAt,
        mockOrderData.expiresAt
      );

      expect(Array.isArray(event.items)).toBe(true);
      expect(event.items).toHaveLength(2);
    });
  });
});
