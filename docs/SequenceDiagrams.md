# API 기능별 시퀀스 다이어그램



## 1. 포인트 관리 API

### 1.1 포인트 충전
```mermaid
sequenceDiagram
    participant Client
    participant UserController
    participant UserService
    participant PointRepository

    Client->>UserController: POST /users/{userId}/points
    Note over Client,UserController: { "amount": 1000 }
    
    UserController->>UserService: chargePoints(userId: number, amount: number)
    UserService->>PointRepository: findOne({ userId })
    PointRepository-->>UserService: point
    
    alt 포인트 레코드가 존재하는 경우
        UserService->>PointRepository: save(updatedPoint)
    else 포인트 레코드가 없는 경우
        UserService->>PointRepository: save({ userId: number, amount: number })
    end
    
    PointRepository-->>UserService: updatedPoint
    UserService-->>UserController: point
    UserController-->>Client: 200 OK
    Note over Client,UserController: { "userId": 1, "amount": 1000 }
```

### 1.2 포인트 조회
```mermaid
sequenceDiagram
    participant Client
    participant UserController
    participant UserService
    participant PointRepository

    Client->>UserController: GET /users/{userId}/points
    
    UserController->>UserService: getUserPoints(userId: number)
    UserService->>PointRepository: findOne({ userId })
    PointRepository-->>UserService: point
    
    alt 포인트 레코드가 존재하는 경우
        UserService-->>UserController: point
    else 포인트 레코드가 없는 경우
        UserService->>PointRepository: save({ userId: number, amount: 0 })
        PointRepository-->>UserService: newPoint
        UserService-->>UserController: newPoint
    end
    
    UserController-->>Client: 200 OK
    Note over Client,UserController: { "userId": 1, "amount": 1000 }
```

## 2. 상품 관리 API

### 2.1 상품 목록 조회
```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository

    Client->>ProductController: GET /products
    Note over Client,ProductController: ?page=1&limit=10&category=electronics
    
    ProductController->>ProductService: getProducts(query)
    ProductService->>ProductRepository: find(options)
    ProductRepository-->>ProductService: products
    
    ProductService-->>ProductController: products
    ProductController-->>Client: 200 OK
    Note over Client,ProductController: { "products": [...], "total": 50, "page": 1 }
```

### 2.2 인기 판매 상품 조회
```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant OrderRepository

    Client->>ProductController: GET /products/top-sellers
    
    ProductController->>ProductService: getTopSellers()
    ProductService->>OrderRepository: getTopSellingProducts(days: 3, limit: 5)
    OrderRepository-->>ProductService: topSellingProducts
    
    ProductService->>ProductService: calculateSalesStatistics(topSellingProducts)
    ProductService-->>ProductController: topSellers
    ProductController-->>Client: 200 OK
    Note over Client,ProductController: { "topSellers": [...], "period": "3일" }
```



## 3. 쿠폰 관리 API

### 3.1 쿠폰 발급
```mermaid
sequenceDiagram
    participant Client
    participant CouponController
    participant CouponService
    participant CouponRepository
    participant UserService

    Client->>CouponController: POST /coupons/issue
    Note over Client,CouponController: { "userId": 1, "couponType": "DISCOUNT", "discountRate": 10, "expiryDate": "2024-12-31" }
    
    CouponController->>CouponService: issueCoupon(issueCouponDto)
    CouponService->>UserService: getUserById(userId: number)
    UserService-->>CouponService: user
    
    CouponService->>CouponRepository: save(coupon)
    CouponRepository-->>CouponService: savedCoupon
    
    CouponService-->>CouponController: coupon
    CouponController-->>Client: 201 Created
    Note over Client,CouponController: { "couponId": 1, "userId": 1, "couponType": "DISCOUNT", "discountRate": 10, "expiryDate": "2024-12-31", "isUsed": false }
```

### 3.2 보유 쿠폰 조회
```mermaid
sequenceDiagram
    participant Client
    participant CouponController
    participant CouponService
    participant CouponRepository

    Client->>CouponController: GET /coupons/user/{userId}
    
    CouponController->>CouponService: getUserCoupons(userId: number)
    CouponService->>CouponRepository: find({ userId })
    CouponRepository-->>CouponService: coupons
    
    CouponService->>CouponService: filterValidCoupons(coupons)
    CouponService-->>CouponController: validCoupons
    CouponController-->>Client: 200 OK
    Note over Client,CouponController: { "coupons": [...], "count": 2 }
```



## 4. 주문 관리 API

### 4.1 주문 생성
```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant ProductService
    participant CouponService
    participant OrderRepository
    participant OrderItemRepository

    Client->>OrderController: POST /orders
    Note over Client,OrderController: { "userId": 1, "items": [...], "couponId": 1 }
    
    OrderController->>OrderService: createOrder(createOrderDto)
    OrderService->>ProductService: validateProducts(items)
    ProductService-->>OrderService: products
    
    OrderService->>ProductService: checkStock(items)
    ProductService-->>OrderService: stockValidation
    
    alt 재고가 충분한 경우
        opt 쿠폰이 있는 경우
            OrderService->>CouponService: validateCoupon(couponId: number, userId: number)
            CouponService-->>OrderService: couponValidation
        end
        
        OrderService->>OrderService: calculateTotalAmount(items)
        OrderService->>OrderService: calculateDiscount(coupon)
        OrderService->>OrderService: calculateFinalAmount()
        
        OrderService->>OrderRepository: save(order)
        OrderRepository-->>OrderService: savedOrder
        
        OrderService->>OrderItemRepository: save(orderItems)
        OrderItemRepository-->>OrderService: savedOrderItems
        
        OrderService-->>OrderController: order
        OrderController-->>Client: 201 Created
        Note over Client,OrderController: { "orderId": 1, "userId": 1, "couponId": 1, "totalAmount": 100000, "discountAmount": 10000, "finalAmount": 90000, "status": "PENDING" }
    else 재고가 부족한 경우
        OrderService-->>OrderController: BadRequestException
        OrderController-->>Client: 400 Bad Request
    end
```



## 5. 결제 처리 API

### 5.1 결제 처리
```mermaid
sequenceDiagram
    participant Client
    participant PaymentController
    participant PaymentService
    participant OrderService
    participant PointService
    participant ProductService
    participant CouponService
    participant PaymentRepository

    Client->>PaymentController: POST /payments/process
    Note over Client,PaymentController: { "orderId": 1 }
    
    PaymentController->>PaymentService: processPayment(orderId: number)
    PaymentService->>OrderService: getOrderById(orderId)
    OrderService-->>PaymentService: order
    
    PaymentService->>UserService: getUserPoints(order.userId: number)
    UserService-->>PaymentService: userPoints
    
    alt 포인트가 충분한 경우
        PaymentService->>UserService: usePoints(order.userId, order.finalAmount)
        UserService-->>PaymentService: updatedPoints
        
        PaymentService->>ProductService: updateStock(order.items)
        ProductService-->>PaymentService: updatedProducts
        
        opt 쿠폰이 사용된 경우
            PaymentService->>CouponService: useCoupon(order.couponId: number)
            CouponService-->>PaymentService: updatedCoupon
        end
        
        PaymentService->>OrderService: updateOrderStatus(orderId, 'PAID')
        OrderService-->>PaymentService: updatedOrder
        
        PaymentService->>PaymentRepository: save(payment)
        PaymentRepository-->>PaymentService: savedPayment
        
        PaymentService-->>PaymentController: payment
        PaymentController-->>Client: 200 OK
        Note over Client,PaymentController: { "paymentId": 1, "orderId": 1, "totalAmount": 100000, "discountAmount": 10000, "finalAmount": 90000, "couponUsed": true, "status": "SUCCESS", "paidAt": "2024-01-01T10:00:00Z" }
    else 포인트가 부족한 경우
        PaymentService-->>PaymentController: BadRequestException
        PaymentController-->>Client: 400 Bad Request
        Note over Client,PaymentController: { "message": "포인트가 부족합니다" }
    end
```

## 6. 에러 처리 시나리오

### 6.1 재고 부족 시 주문 실패
```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant ProductService

    Client->>OrderController: POST /orders
    Note over Client,OrderController: { "items": [{"productId": 1, "quantity": 100}] }
    
    OrderController->>OrderService: createOrder(createOrderDto)
    OrderService->>ProductService: checkStock(items)
    ProductService->>ProductService: getStock(productId: number)
    ProductService-->>OrderService: { "productId": 1, "availableStock": 10 }
    
    OrderService->>OrderService: validateStock(items, availableStock)
    OrderService-->>OrderController: BadRequestException
    Note over OrderService,OrderController: "재고가 부족합니다"
    
    OrderController-->>Client: 400 Bad Request
    Note over Client,OrderController: { "message": "재고가 부족합니다" }
```

### 6.2 쿠폰 유효하지 않을 시 주문 실패
```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant CouponService

    Client->>OrderController: POST /orders
    Note over Client,OrderController: { "couponId": 999 }
    
    OrderController->>OrderService: createOrder(createOrderDto)
    OrderService->>CouponService: validateCoupon(couponId: number, userId: number)
    CouponService->>CouponService: findCoupon(couponId)
    CouponService-->>OrderService: null
    
    OrderService-->>OrderController: BadRequestException
    Note over OrderService,OrderController: "유효하지 않은 쿠폰입니다"
    
    OrderController-->>Client: 400 Bad Request
    Note over Client,OrderController: { "message": "유효하지 않은 쿠폰입니다" }
```

### 6.3 포인트 부족 시 결제 실패
```mermaid
sequenceDiagram
    participant Client
    participant PaymentController
    participant PaymentService
    participant UserService

    Client->>PaymentController: POST /payments/process
    Note over Client,PaymentController: { "orderId": 1 }
    
    PaymentController->>PaymentService: processPayment(orderId: number)
    PaymentService->>UserService: getUserPoints(userId: number)
    UserService-->>PaymentService: { "amount": 1000 }
    
    PaymentService->>PaymentService: checkSufficientPoints(requiredAmount, availablePoints)
    PaymentService-->>PaymentController: BadRequestException
    Note over PaymentService,PaymentController: "포인트가 부족합니다"
    
    PaymentController-->>Client: 400 Bad Request
    Note over Client,PaymentController: { "message": "포인트가 부족합니다" }
``` 