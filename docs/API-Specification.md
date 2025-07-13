| 기능             | Method | Endpoint                            | 요청 예시                                | 응답 예시                               | 예외 상황                     |
|------------------|--------|-------------------------------------|------------------------------------------|------------------------------------------|-------------------------------|
| 잔액 충전        | POST   | /users/{userId}/balance             | { "amount": 10000 }                       | { "userId": 1, "balance": 15000 }        | -                             |
| 잔액 조회        | GET    | /users/{userId}/balance             | 없음                                     | { "userId": 1, "balance": 15000 }        | -                             |
| 상품 목록 조회   | GET    | /products                           | 없음                                     | [{ "id":1,"name":"커피",... }]           | -                             |
| 쿠폰 발급        | POST   | /users/{userId}/coupons             | { "couponType": "DISCOUNT_10PERCENT" }   | { "couponId":10, ... }                   | { "error": "쿠폰 소진" }     |
| 보유 쿠폰 조회   | GET    | /users/{userId}/coupons             | 없음                                     | [{ "couponId":10, ... }]                 | -                             |
| 주문 및 결제     | POST   | /orders                             | { "userId":1,"items":[...], "couponId":10}| { "orderId":100, ... }                   | 잔액/재고/쿠폰 에러들        |
| 인기 상품 조회   | GET    | /products/top-sellers?days=3&limit=5| 없음                                     | [{ "id":1, "name":"커피", ... }]         | -                             |
