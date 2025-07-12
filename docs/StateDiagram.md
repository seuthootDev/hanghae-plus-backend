```mermaid
stateDiagram-v2
    [*] --> OrderCreated : 주문 생성
    OrderCreated --> CheckingRequirements : 결제 시도
    CheckingRequirements --> PaymentFailed : 잔액/재고/쿠폰 미충족
    CheckingRequirements --> PaymentSucceeded : 잔액/재고/쿠폰 충족
    PaymentSucceeded --> SendingOrderInfo : 주문정보 데이터 전송
    SendingOrderInfo --> Done : 완료
    PaymentFailed --> [*]
    Done --> [*]

    note right of OrderCreated
      사용자가 상품 및 수량 선택, 쿠폰(선택)
    end note
    note right of CheckingRequirements
      1. 유저 잔액 충분?
      2. 상품 재고 충분?
      3. 쿠폰 유효?
    end note
    note right of PaymentSucceeded
      주문정보를 데이터 플랫폼에 전송
    end note