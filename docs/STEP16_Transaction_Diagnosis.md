# STEP 16: Transaction Diagnosis

## 📋 개요

현재 모놀리식 구조에서 마이크로서비스로 전환할 때 발생하는 트랜잭션 처리의 한계와 대응 방안에 대한 분석입니다.

## ⚠️ 마이크로서비스 전환 시 현재 구조의 한계

### **현재 주문 생성 use-case (모놀리식)**
```typescript
@Transactional()
async createOrder() {
  // 1. 주문 생성
  const order = await this.orderRepository.create(orderData);
  
  // 2. 쿠폰 사용 - 같은 서버, 같은 DB
  if (couponId) {
    await this.couponService.useCoupon(couponId); // 빠름
  }
  
  // 3. 재고 차감 - 같은 서버, 같은 DB  
  await this.productService.decreaseStock(productId, quantity); // 빠름
}
```

### **마이크로서비스로 분리 후**
```typescript
async createOrder() {
  // 1. 주문 생성
  const order = await this.orderRepository.create(orderData);
  
  // 2. 쿠폰 사용 - 다른 서버에 HTTP 요청
  if (couponId) {
    await this.httpService.post('http://coupon-service:3003/coupons/use', {
      couponId,
      orderId: order.id
    }); // 느림 (네트워크 지연)
  }
  
  // 3. 재고 차감 - 또 다른 서버에 HTTP 요청
  await this.httpService.post('http://product-service:3004/products/decrease-stock', {
    productId,
    quantity
  }); // 느림 (네트워크 지연)
}
```

### **문제점**
- **쿠폰 사용 API 응답을 기다려야 함** (느림)
- **재고 차감 API 응답을 기다려야 함** (느림)
- **어느 단계에서 실패해도 롤백이 어려움**

## 🛠️ 해결 방안

### **1. 이벤트 기반 비동기 처리** - API 응답 기다림 문제 해결

```typescript
async createOrder() {
  // 1. 주문만 먼저 생성
  const order = await this.orderRepository.create(orderData);
  
  // 2. 이벤트 발행 (기다리지 않음!)
  await this.eventBus.publish(new OrderCreatedEvent({
    orderId: order.id,
    couponId,
    productId,
    quantity
  }));
  
  // 3. 즉시 응답 (쿠폰 사용, 재고 차감은 나중에)
  return order;
}
```

- 쿠폰 사용 API 응답을 기다리지 않음
- 빠른 응답 시간
- 서비스 간 느슨한 결합

### **2. Saga 패턴** - 롤백

```typescript
class CreateOrderSaga {
  private steps = {
    orderCreated: false,
    couponUsed: false,
    stockDecreased: false
  };

  async execute() {
    try {
      // 1. 주문 생성
      const order = await this.orderService.create(orderData);
      this.steps.orderCreated = true;
      
      // 2. 쿠폰 사용
      if (couponId) {
        await this.couponService.useCoupon(couponId);
        this.steps.couponUsed = true;
      }
      
      // 3. 재고 차감
      await this.productService.decreaseStock(productId, quantity);
      this.steps.stockDecreased = true;
      
    } catch (error) {
      // 실패 시 보상 트랜잭션 실행
      await this.compensate();
      throw error;
    }
  }
  
  async compensate() {
    // 성공한 단계만 역순으로 되돌리기
    if (this.steps.stockDecreased) {
      await this.productService.increaseStock(productId, quantity);
    }
    
    if (this.steps.couponUsed) {
      await this.couponService.refundCoupon(couponId);
    }
    
    if (this.steps.orderCreated) {
      await this.orderService.cancelOrder(orderId);
    }
  }
}
```
- 실패 시 안전하게 되돌리기
- 각 단계의 성공/실패 상태 추적
- 복잡한 분산 트랜잭션 관리

## 📝 결론

**마이크로서비스 전환 시 핵심 문제:**
1. **API 응답 기다림** → 이벤트 기반 비동기 처리로 해결
2. **롤백** → Saga 패턴으로 해결

- Saga 패턴으로만 롤백이 가능한 것은 아니지만, Saga 패턴의 역순 롤백은 롤백을 더 안정적으로 만듬

---