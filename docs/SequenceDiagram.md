```mermaid
sequenceDiagram
    participant User
    participant App
    participant Product
    participant Balance
    participant Coupon
    participant Payment
    participant DataPlatform

    User->>App: 상품 목록 조회
    App->>Product: 상품 리스트, 재고 확인
    Product-->>App: 상품/재고 정보
    App-->>User: 상품/재고 정보

    User->>App: 주문 생성(상품, 수량, 쿠폰)
    App->>Balance: 잔액 확인/차감
    Balance-->>App: 잔액 결과(충분/부족)

    App->>Product: 재고 체크/차감
    Product-->>App: 재고 결과(충분/부족)

    alt 쿠폰 사용시
      App->>Coupon: 쿠폰 유효성, 차감
      Coupon-->>App: 할인금액/결과
    end

    App->>Payment: 결제 요청(잔액, 쿠폰할인 적용)
    Payment-->>App: 결제 결과
    App-->>User: 결제 결과(성공/실패)

    opt 결제 성공시
      App->>DataPlatform: 주문/결제 실시간 전송
    end
