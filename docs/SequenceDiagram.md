```mermaid
sequenceDiagram
    participant User
    participant UserService
    participant Point
    participant ProductService
    participant Product
    participant OrderService
    participant Order
    participant CouponService
    participant Coupon
    participant PaymentService
    participant Payment

    %% 포인트 충전
    User->>UserService: 포인트 충전 요청(userId, amount)
    UserService->>Point: charge(amount)
    Point-->>UserService: 업데이트된 포인트
    UserService-->>User: 충전 완료

    %% 포인트 조회
    User->>UserService: 포인트 조회 요청(userId)
    UserService->>Point: getAmount()
    Point-->>UserService: 현재 포인트
    UserService-->>User: 포인트 정보

    %% 상품 목록 조회
    User->>ProductService: 상품 목록 요청
    ProductService->>Product: getProducts()
    Product-->>ProductService: 상품 목록
    ProductService-->>User: 상품 목록

    %% 주문 생성
    User->>OrderService: 주문 생성(userId, items, couponId)
    OrderService->>ProductService: 재고 확인
    ProductService->>Product: getStock()
    Product-->>ProductService: 재고 정보
    ProductService-->>OrderService: 재고 확인 결과
    
    alt 쿠폰 사용시
        OrderService->>CouponService: 쿠폰 유효성 확인(couponId)
        CouponService->>Coupon: validateCoupon(couponId)
        Coupon-->>CouponService: 할인 정보
        CouponService-->>OrderService: 쿠폰 유효성
    end
    
    OrderService->>Order: 주문 생성 및 금액 계산
    Order-->>OrderService: 생성된 주문 정보
    OrderService-->>User: 주문 생성 완료

    %% 결제 처리
    User->>PaymentService: 결제 요청(orderId, userId)
    PaymentService->>OrderService: 주문 정보 조회(orderId)
    OrderService->>Order: getOrder(orderId)
    Order-->>OrderService: 주문 상세 정보
    OrderService-->>PaymentService: 주문 정보
    
    PaymentService->>UserService: 포인트 차감 요청(userId, amount)
    UserService->>Point: deduct(amount)
    Point-->>UserService: 차감 결과
    UserService-->>PaymentService: 포인트 차감 완료
    
    alt 결제 성공시
        PaymentService->>ProductService: 재고 차감
        ProductService->>Product: deductStock(quantity)
        Product-->>ProductService: 재고 업데이트
        ProductService-->>PaymentService: 재고 차감 완료
        
        alt 쿠폰 사용시
            PaymentService->>CouponService: 쿠폰 사용 처리(couponId)
            CouponService->>Coupon: use()
            Coupon-->>CouponService: 쿠폰 상태 업데이트
            CouponService-->>PaymentService: 쿠폰 사용 완료
        end
        
        PaymentService->>Payment: 결제 정보 저장
        Payment-->>PaymentService: 결제 완료
        PaymentService-->>User: 결제 완료
    else 포인트 부족시
        PaymentService-->>User: 결제 실패(포인트 부족)
    end

    %% 쿠폰 발급
    User->>CouponService: 쿠폰 발급 요청(userId, couponType)
    CouponService->>Coupon: assignTo(user)
    Coupon-->>CouponService: 쿠폰 생성 완료
    CouponService-->>User: 발급된 쿠폰 정보

    %% 보유 쿠폰 조회
    User->>CouponService: 보유 쿠폰 조회(userId)
    CouponService->>Coupon: getUserCoupons(userId)
    Coupon-->>CouponService: 쿠폰 목록
    CouponService-->>User: 쿠폰 목록

    %% 인기 상품 조회
    User->>ProductService: 인기 상품 조회
    ProductService->>Product: getTopSellers()
    Product-->>ProductService: 인기 상품 목록
    ProductService-->>User: 인기 상품 목록

    %% 에러 처리 시나리오
    Note over User,ProductService: 재고 부족 시
    User->>OrderService: 주문 생성
    OrderService->>ProductService: 재고 확인
    ProductService->>Product: getStock()
    Product-->>ProductService: 재고 부족
    ProductService-->>OrderService: 재고 부족
    OrderService-->>User: 주문 실패(재고 부족)

    Note over User,UserService: 포인트 부족 시
    User->>PaymentService: 결제 요청
    PaymentService->>UserService: 포인트 확인
    UserService->>Point: getAmount()
    Point-->>UserService: 포인트 부족
    UserService-->>PaymentService: 포인트 부족
    PaymentService-->>User: 결제 실패(포인트 부족)

    Note over User,CouponService: 쿠폰 유효하지 않을 시
    User->>OrderService: 주문 생성(잘못된 쿠폰)
    OrderService->>CouponService: 쿠폰 유효성 확인
    CouponService->>Coupon: validateCoupon(couponId)
    Coupon-->>CouponService: 쿠폰 무효
    CouponService-->>OrderService: 쿠폰 무효
    OrderService-->>User: 주문 실패(쿠폰 무효)
