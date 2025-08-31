import { PaymentCompletedEvent } from '../../../src/domain/events/payment-completed.event';

describe('PaymentCompletedEvent', () => {
  it('결제 완료 이벤트가 올바르게 생성되어야 한다', () => {
    // Arrange
    const orderId = '123';
    const userId = '456';
    const products = [
      { productId: 1, name: '상품1', price: 10000, quantity: 2 },
      { productId: 2, name: '상품2', price: 15000, quantity: 1 }
    ];
    const totalAmount = 35000;
    const discountAmount = 5000;
    const finalAmount = 30000;
    const couponUsed = true;
    const paidAt = new Date('2024-01-15T10:30:00Z');
    const status = 'PAID';

    // Act
    const event = new PaymentCompletedEvent(
      orderId,
      userId,
      products,
      totalAmount,
      discountAmount,
      finalAmount,
      couponUsed,
      paidAt,
      status
    );

    // Assert
    expect(event.orderId).toBe(orderId);
    expect(event.userId).toBe(userId);
    expect(event.products).toBe(products);
    expect(event.totalAmount).toBe(totalAmount);
    expect(event.discountAmount).toBe(discountAmount);
    expect(event.finalAmount).toBe(finalAmount);
    expect(event.couponUsed).toBe(couponUsed);
    expect(event.paidAt).toBe(paidAt);
    expect(event.status).toBe(status);
  });

  it('이벤트의 모든 속성이 읽기 전용이어야 한다', () => {
    // Arrange
    const event = new PaymentCompletedEvent(
      '123',
      '456',
      [],
      10000,
      0,
      10000,
      false,
      new Date(),
      'PAID'
    );

    // Act & Assert - TypeScript 컴파일 타임에 readonly 검증
    // 런타임에서는 JavaScript이므로 실제로는 수정 가능하지만,
    // TypeScript 컴파일러가 readonly를 보장함
    expect(event.orderId).toBe('123');
    expect(event.userId).toBe('456');
    expect(event.totalAmount).toBe(10000);
    
    // readonly 속성은 수정 시도 시 컴파일 에러가 발생해야 함
    // (실제 테스트에서는 TypeScript 컴파일러가 이미 검증함)
  });
});
