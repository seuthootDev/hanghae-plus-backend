# API 기능별 시퀀스 다이어그램

## 1. 사용자 관리 API

### 1.1 사용자 생성
```mermaid
sequenceDiagram
    participant Client
    participant UserController
    participant UserService
    participant UserRepository
    participant PointRepository

    Client->>UserController: POST /users
    Note over Client,UserController: { "name": "홍길동" }
    
    UserController->>UserService: createUser(createUserDto)
    UserService->>UserRepository: save(user)
    UserRepository-->>UserService: savedUser
    
    UserService->>PointRepository: save({ userId: number, amount: 0 })
    PointRepository-->>UserService: pointRecord
    
    UserService-->>UserController: user
    UserController-->>Client: 201 Created
    Note over Client,UserController: { "userId": 1, "name": "홍길동" }
```

### 1.2 사용자 조회
```mermaid
sequenceDiagram
    participant Client
    participant UserController
    participant UserService
    participant UserRepository

    Client->>UserController: GET /users/{userId}
    
    UserController->>UserService: getUserById(userId: number)
    UserService->>UserRepository: findOne({ userId })
    UserRepository-->>UserService: user
    
    alt 사용자가 존재하는 경우
        UserService-->>UserController: user
        UserController-->>Client: 200 OK
        Note over Client,UserController: { "userId": 1, "name": "홍길동" }
    else 사용자가 존재하지 않는 경우
        UserService-->>UserController: NotFoundException
        UserController-->>Client: 404 Not Found
    end
```

## 2. 포인트 관리 API

### 2.1 포인트 충전
```mermaid
sequenceDiagram
    participant Client
    participant PointController
    participant PointService
    participant PointRepository
    participant UserService

    Client->>PointController: POST /points/charge
    Note over Client,PointController: { "userId": 1, "amount": 1000 }
    
    PointController->>PointService: chargePoints(userId: number, amount: number)
    PointService->>UserService: getUserById(userId)
    UserService-->>PointService: user
    
    PointService->>PointRepository: findOne({ userId })
    PointRepository-->>PointService: point
    
    alt 포인트 레코드가 존재하는 경우
        PointService->>PointRepository: save(updatedPoint)
    else 포인트 레코드가 없는 경우
        PointService->>PointRepository: save({ userId: number, amount: number })
    end
    
    PointRepository-->>PointService: updatedPoint
    PointService-->>PointController: point
    PointController-->>Client: 200 OK
    Note over Client,PointController: { "userId": 1, "amount": 1000 }
```

### 2.2 포인트 조회
```mermaid
sequenceDiagram
    participant Client
    participant PointController
    participant PointService
    participant PointRepository
    participant UserService

    Client->>PointController: GET /points/{userId}
    
    PointController->>PointService: getUserPoints(userId: number)
    PointService->>UserService: getUserById(userId)
    UserService-->>PointService: user
    
    PointService->>PointRepository: findOne({ userId })
    PointRepository-->>PointService: point
    
    alt 포인트 레코드가 존재하는 경우
        PointService-->>PointController: point
    else 포인트 레코드가 없는 경우
        PointService->>PointRepository: save({ userId: number, amount: 0 })
        PointRepository-->>PointService: newPoint
        PointService-->>PointController: newPoint
    end
    
    PointController-->>Client: 200 OK
    Note over Client,PointController: { "userId": 1, "amount": 1000 }
```

## 3. 상품 관리 API

### 3.1 상품 목록 조회
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

### 3.2 상품 상세 조회
```mermaid
sequenceDiagram
    participant Client
    participant ProductController
    participant ProductService
    participant ProductRepository

    Client->>ProductController: GET /products/{productId}
    
    ProductController->>ProductService: getProductById(productId: number)
    ProductService->>ProductRepository: findOne({ productId })
    ProductRepository-->>ProductService: product
    
    alt 상품이 존재하는 경우
        ProductService-->>ProductController: product
        ProductController-->>Client: 200 OK
        Note over Client,ProductController: { "productId": 1, "name": "노트북", "price": 1000000, "stock": 10, "category": "electronics" }
    else 상품이 존재하지 않는 경우
        ProductService-->>ProductController: NotFoundException
        ProductController-->>Client: 404 Not Found
    end
```

## 4. 쿠폰 관리 API

### 4.1 쿠폰 발급
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

### 4.2 쿠폰 유효성 검증
```mermaid
sequenceDiagram
    participant Client
    participant CouponController
    participant CouponService
    participant CouponRepository

    Client->>CouponController: POST /coupons/validate
    Note over Client,CouponController: { "couponId": 1, "userId": 1 }
    
    CouponController->>CouponService: validateCoupon(couponId: number, userId: number)
    CouponService->>CouponRepository: findOne({ couponId, userId })
    CouponRepository-->>CouponService: coupon
    
    alt 쿠폰이 존재하고 유효한 경우
        CouponService->>CouponService: validateExpiryDate(coupon.expiryDate)
        CouponService->>CouponService: validateUsageStatus(coupon.isUsed)
        CouponService-->>CouponController: validationResult
        CouponController-->>Client: 200 OK
        Note over Client,CouponController: { "valid": true, "discountRate": 10, "couponType": "DISCOUNT" }
    else 쿠폰이 유효하지 않은 경우
        CouponService-->>CouponController: validationResult
        CouponController-->>Client: 400 Bad Request
        Note over Client,CouponController: { "valid": false, "message": "쿠폰이 유효하지 않습니다" }
    end
```

## 5. 주문 관리 API

### 5.1 주문 생성
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

### 5.2 주문 조회
```mermaid
sequenceDiagram
    participant Client
    participant OrderController
    participant OrderService
    participant OrderRepository
    participant OrderItemRepository

    Client->>OrderController: GET /orders/{orderId}
    
    OrderController->>OrderService: getOrderById(orderId: number)
    OrderService->>OrderRepository: findOne({ orderId })
    OrderRepository-->>OrderService: order
    
    alt 주문이 존재하는 경우
        OrderService->>OrderItemRepository: find({ orderId })
        OrderItemRepository-->>OrderService: orderItems
        
        OrderService->>OrderService: combineOrderWithItems(order, orderItems)
        OrderService-->>OrderController: orderWithItems
        OrderController-->>Client: 200 OK
        Note over Client,OrderController: { "orderId": 1, "userId": 1, "couponId": 1, "items": [...], "totalAmount": 100000, "discountAmount": 10000, "finalAmount": 90000, "status": "PENDING" }
    else 주문이 존재하지 않는 경우
        OrderService-->>OrderController: NotFoundException
        OrderController-->>Client: 404 Not Found
    end
```

## 6. 결제 처리 API

### 6.1 결제 처리
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
    
    PaymentService->>PointService: getUserPoints(order.userId: number)
    PointService-->>PaymentService: userPoints
    
    alt 포인트가 충분한 경우
        PaymentService->>PointService: usePoints(order.userId, order.finalAmount)
        PointService-->>PaymentService: updatedPoints
        
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

## 7. 에러 처리 시나리오

### 7.1 재고 부족 시 주문 실패
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

### 7.2 쿠폰 유효하지 않을 시 주문 실패
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

### 7.3 포인트 부족 시 결제 실패
```mermaid
sequenceDiagram
    participant Client
    participant PaymentController
    participant PaymentService
    participant PointService

    Client->>PaymentController: POST /payments/process
    Note over Client,PaymentController: { "orderId": 1 }
    
    PaymentController->>PaymentService: processPayment(orderId: number)
    PaymentService->>PointService: getUserPoints(userId: number)
    PointService-->>PaymentService: { "amount": 1000 }
    
    PaymentService->>PaymentService: checkSufficientPoints(requiredAmount, availablePoints)
    PaymentService-->>PaymentController: BadRequestException
    Note over PaymentService,PaymentController: "포인트가 부족합니다"
    
    PaymentController-->>Client: 400 Bad Request
    Note over Client,PaymentController: { "message": "포인트가 부족합니다" }
``` 