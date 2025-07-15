```mermaid
stateDiagram-v2
    [*] --> Browsing : 상품 둘러보기
    Browsing --> Ordering : 주문하기
    Ordering --> PaymentProcessing : 결제 중
    PaymentProcessing --> OrderCompleted : 주문 완료
    PaymentProcessing --> OrderFailed : 주문 실패
    OrderCompleted --> Browsing : 계속 쇼핑
    OrderFailed --> Browsing : 다시 시도

    note right of Browsing
      상품 목록 조회, 포인트 충전
    end note
    note right of Ordering
      상품 선택, 수량 지정, 쿠폰 적용
    end note
    note right of PaymentProcessing
      포인트 차감, 재고 확인, 쿠폰 사용
    end note
    note right of OrderCompleted
      주문 성공, 주문 정보 전송
    end note
    note right of OrderFailed
      포인트 부족, 재고 부족, 쿠폰 무효
    end note