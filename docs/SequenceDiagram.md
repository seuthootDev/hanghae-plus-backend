```mermaid
sequenceDiagram
    participant User
    participant Point
    participant Product
    participant Order
    participant Coupon
    participant Payment

    %% 포인트 충전
    User->>Point: 포인트 충전 요청(amount)
    Point->>Point: charge(amount)
    Point-->>User: 업데이트된 포인트

    %% 포인트 조회
    User->>Point: 포인트 조회
    Point->>Point: getAmount()
    Point-->>User: 현재 포인트

    %% 상품 목록 조회
    User->>Product: 상품 목록 요청
    Product-->>User: 상품 목록

    %% 주문 생성
    User->>Order: 주문 생성(상품, 수량, 쿠폰)
    Order->>Product: 재고 확인
    Product->>Product: getStock()
    Product-->>Order: 재고 정보
    
    alt 쿠폰 사용시
        Order->>Coupon: 쿠폰 유효성 확인
        Coupon->>Coupon: validateCoupon(couponId)
        Coupon-->>Order: 할인 정보
    end
    
    Order->>Order: 주문 생성 및 금액 계산
    Order-->>User: 생성된 주문 정보

    %% 결제 처리
    User->>Payment: 결제 요청(주문ID)
    Payment->>Order: 주문 정보 조회
    Order-->>Payment: 주문 상세 정보
    
    Payment->>Point: 포인트 차감
    Point->>Point: deduct(amount)
    Point-->>Payment: 차감 결과
    
    alt 결제 성공시
        Payment->>Product: 재고 차감
        Product->>Product: deductStock(quantity)
        Product-->>Payment: 재고 업데이트
        
        alt 쿠폰 사용시
            Payment->>Coupon: 쿠폰 사용 처리
            Coupon->>Coupon: use()
            Coupon-->>Payment: 쿠폰 상태 업데이트
        end
        
        Payment->>Order: 주문 상태 업데이트
        Order-->>Payment: 업데이트 완료
        Payment-->>User: 결제 완료
    else 포인트 부족시
        Payment-->>User: 결제 실패(포인트 부족)
    end

    %% 쿠폰 발급
    User->>Coupon: 쿠폰 발급 요청
    Coupon->>Coupon: assignTo(user)
    Coupon-->>User: 발급된 쿠폰 정보

    %% 보유 쿠폰 조회
    User->>Coupon: 보유 쿠폰 조회
    Coupon->>Coupon: getUserCoupons(userId)
    Coupon-->>User: 쿠폰 목록

    %% 인기 상품 조회
    User->>Product: 인기 상품 조회
    Product->>Product: getTopSellers()
    Product-->>User: 인기 상품 목록

    %% 에러 처리 시나리오
    Note over User,Product: 재고 부족 시
    User->>Order: 주문 생성
    Order->>Product: 재고 확인
    Product->>Product: getStock()
    Product-->>Order: 재고 부족
    Order-->>User: 주문 실패(재고 부족)

    Note over User,Point: 포인트 부족 시
    User->>Payment: 결제 요청
    Payment->>Point: 포인트 확인
    Point->>Point: getAmount()
    Point-->>Payment: 포인트 부족
    Payment-->>User: 결제 실패(포인트 부족)

    Note over User,Coupon: 쿠폰 유효하지 않을 시
    User->>Order: 주문 생성(잘못된 쿠폰)
    Order->>Coupon: 쿠폰 유효성 확인
    Coupon->>Coupon: validateCoupon(couponId)
    Coupon-->>Order: 쿠폰 무효
    Order-->>User: 주문 실패(쿠폰 무효)
