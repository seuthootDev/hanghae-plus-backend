```mermaid
stateDiagram-v2
    [*] --> Browsing : 상품 둘러보기
    Browsing --> PointCharging : 포인트 충전
    PointCharging --> Browsing : 충전 완료
    Browsing --> CouponIssuing : 쿠폰 발급
    CouponIssuing --> Browsing : 발급 완료
    Browsing --> Ordering : 주문하기
    Ordering --> CouponApplying : 쿠폰 적용
    CouponApplying --> Ordering : 쿠폰 적용 완료
    CouponApplying --> Ordering : 쿠폰 적용 실패
    Ordering --> PaymentProcessing : 결제 중
    PaymentProcessing --> OrderCompleted : 주문 완료
    PaymentProcessing --> OrderFailed : 주문 실패
    OrderCompleted --> Browsing : 계속 쇼핑
    OrderFailed --> Browsing : 다시 시도

    note right of Browsing
      상품 목록 조회, 포인트 조회, 쿠폰 조회
    end note
    note right of PointCharging
      포인트 충전 요청 및 처리
    end note
    note right of CouponIssuing
      쿠폰 발급 요청 및 처리
    end note
    note right of Ordering
      상품 선택, 수량 지정
    end note
    note right of CouponApplying
      쿠폰 유효성 검증 및 할인 적용
    end note
    note right of PaymentProcessing
      포인트 차감, 재고 확인, 쿠폰 상태
    end note
    note right of OrderCompleted
      주문 성공, 주문 정보 전송
    end note
    note right of OrderFailed
      포인트 부족, 재고 부족, 쿠폰 무효
    end note