```mermaid
%% 유스케이스 다이어그램
flowchart TD
  User((사용자))

  UC1([잔액 충전])
  UC2([잔액 조회])
  UC3([상품 목록 조회])
  UC4([쿠폰 발급 선착순])
  UC5([보유 쿠폰 목록 조회])
  UC6([상품 주문 및 결제])
  UC7([인기 상품 조회])

  User -- 요청 --> UC1
  User -- 요청 --> UC2
  User -- 요청 --> UC3
  User -- 요청 --> UC4
  User -- 요청 --> UC5
  User -- 요청 --> UC6
  User -- 요청 --> UC7
