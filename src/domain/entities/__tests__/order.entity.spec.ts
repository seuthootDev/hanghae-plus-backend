import { Order, OrderItem } from '../order.entity';

describe('Order Entity', () => {
  let order: Order;
  let orderItems: OrderItem[];

  beforeEach(() => {
    orderItems = [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 15000 }
    ];
    order = new Order(1, 1, orderItems, 35000, 0, 35000);
  });

  describe('getters', () => {
    it('items getter가 주문 아이템들을 반환해야 한다', () => {
      expect(order.items).toEqual(orderItems);
    });

    it('totalAmount getter가 총 금액을 반환해야 한다', () => {
      expect(order.totalAmount).toBe(35000);
    });

    it('discountAmount getter가 할인 금액을 반환해야 한다', () => {
      expect(order.discountAmount).toBe(0);
    });

    it('finalAmount getter가 최종 금액을 반환해야 한다', () => {
      expect(order.finalAmount).toBe(35000);
    });

    it('couponUsed getter가 쿠폰 사용 여부를 반환해야 한다', () => {
      expect(order.couponUsed).toBe(false);
    });

    it('status getter가 주문 상태를 반환해야 한다', () => {
      expect(order.status).toBe('PENDING');
    });
  });

  describe('applyCoupon', () => {
    it('쿠폰을 성공적으로 적용해야 한다', () => {
      const couponId = 123;

      order.applyCoupon(couponId);

      expect(order.couponUsed).toBe(true);
    });

    it('여러 번 쿠폰을 적용해도 상태가 유지되어야 한다', () => {
      order.applyCoupon(123);
      order.applyCoupon(456);

      expect(order.couponUsed).toBe(true);
    });
  });

  describe('calculateDiscount', () => {
    it('할인을 성공적으로 계산해야 한다', () => {
      const discountAmount = 5000;

      order.calculateDiscount(discountAmount);

      expect(order.discountAmount).toBe(discountAmount);
      expect(order.finalAmount).toBe(order.totalAmount - discountAmount);
    });

    it('할인 금액이 총 금액보다 클 때도 처리해야 한다', () => {
      const discountAmount = 50000; // 총 금액(35000)보다 큰 할인

      order.calculateDiscount(discountAmount);

      expect(order.discountAmount).toBe(discountAmount);
      expect(order.finalAmount).toBe(order.totalAmount - discountAmount);
      expect(order.finalAmount).toBe(-15000); // 음수가 될 수 있음
    });

    it('0원 할인도 처리해야 한다', () => {
      const discountAmount = 0;

      order.calculateDiscount(discountAmount);

      expect(order.discountAmount).toBe(0);
      expect(order.finalAmount).toBe(order.totalAmount);
    });
  });

  describe('updateStatus', () => {
    it('주문 상태를 성공적으로 업데이트해야 한다', () => {
      const newStatus = 'CONFIRMED';

      order.updateStatus(newStatus);

      expect(order.status).toBe(newStatus);
    });

    it('여러 번 상태를 업데이트해도 마지막 상태가 유지되어야 한다', () => {
      order.updateStatus('CONFIRMED');
      order.updateStatus('SHIPPED');
      order.updateStatus('DELIVERED');

      expect(order.status).toBe('DELIVERED');
    });
  });

  describe('isValid', () => {
    it('유효한 주문일 때 true를 반환해야 한다', () => {
      expect(order.isValid()).toBe(true);
    });

    it('아이템이 없는 주문일 때 false를 반환해야 한다', () => {
      const emptyOrder = new Order(2, 1, [], 0, 0, 0);
      expect(emptyOrder.isValid()).toBe(false);
    });

    it('최종 금액이 0 이하인 주문일 때 false를 반환해야 한다', () => {
      const invalidOrder = new Order(3, 1, orderItems, 35000, 40000, -5000);
      expect(invalidOrder.isValid()).toBe(false);
    });

    it('최종 금액이 0인 주문일 때 false를 반환해야 한다', () => {
      const zeroOrder = new Order(4, 1, orderItems, 35000, 35000, 0);
      expect(zeroOrder.isValid()).toBe(false);
    });
  });

  describe('OrderItem interface', () => {
    it('OrderItem이 올바른 구조를 가져야 한다', () => {
      const item: OrderItem = {
        productId: 1,
        quantity: 3,
        price: 5000
      };

      expect(item.productId).toBe(1);
      expect(item.quantity).toBe(3);
      expect(item.price).toBe(5000);
    });
  });
}); 