<link rel="stylesheet" href="table-styles.css">

# API 명세서

<table class="api-table">
  <thead>
    <tr>
      <th style="width: 15%;">기능</th>
      <th style="width: 10%;" class="text-center">Method</th>
      <th style="width: 15%;">Endpoint</th>
      <th style="width: 20%;">요청 예시</th>
      <th style="width: 25%;">응답 예시</th>
      <th style="width: 15%;">예외 상황</th>
    </tr>
  </thead>


  <tbody>
    <tr>
      <td class="text-bold">잔액 충전</td>
      <td class="text-center">
        <span class="method-post">POST</span>
      </td>
      <td class="code-text">/users/{userId}/points</td>
      <td class="code-text">
```json
{
  "amount": 10000
}
```
      </td>
      <td class="code-text">
```json
{
  "userId": 1,
  "balance": 15000
}
```
      </td>
      <td class="text-center">최소,최대 금액</td>
    </tr>
    <tr>
      <td class="text-bold">잔액 조회</td>
      <td class="text-center">
        <span class="method-get">GET</span>
      </td>
      <td class="code-text">/users/{userId}/points</td>
      <td class="code-text">없음</td>
      <td class="code-text">
```json
{
  "userId": 1,
  "balance": 15000
}
```
      </td>
      <td class="text-center">-</td>
    </tr>
    <tr>
      <td class="text-bold">상품 목록 조회</td>
      <td class="text-center">
        <span class="method-get">GET</span>
      </td>
      <td class="code-text">/products</td>
      <td class="code-text">없음</td>
      <td class="code-text">
```json
[
  {
    "id": 1,
    "name": "커피",
    "price": 3000,
    "stock": 100,
    "category": "음료"
  }
]
```
      </td>
      <td class="text-center">-</td>
    </tr>
    <tr>
      <td class="text-bold">주문 생성</td>
      <td class="text-center">
        <span class="method-post">POST</span>
      </td>
      <td class="code-text">/orders</td>
      <td class="code-text">
```json
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "couponId": 10
}
```
      </td>
      <td class="code-text">
```json
{
  "orderId": 100,
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 3000
    }
  ],
  "totalAmount": 6000,
  "discountAmount": 600,
  "finalAmount": 5400,
  "couponUsed": true,
  "status": "PENDING"
}
```
      </td>
      <td class="text-center">
        <span class="error-warning">재고 부족</span>
      </td>
    </tr>
    <tr>
      <td class="text-bold">결제 처리</td>
      <td class="text-center">
        <span class="method-post">POST</span>
      </td>
      <td class="code-text">/orders/{orderId}/payment</td>
      <td class="code-text">
```json
{
  "userId": 1,
  "couponId": 10
}
```
      </td>
      <td class="code-text">
```json
{
  "orderId": 100,
  "userId": 1,
  "totalAmount": 6000,
  "discountAmount": 600,
  "finalAmount": 5400,
  "couponUsed": true,
  "status": "COMPLETED",
  "paymentDate": "2024-01-15T10:30:00Z"
}
```
      </td>
      <td class="text-center">
        <span class="error-critical">잔액 부족</span>
      </td>
    </tr>
    <tr>
      <td class="text-bold">쿠폰 발급</td>
      <td class="text-center">
        <span class="method-post">POST</span>
      </td>
      <td class="code-text">/users/{userId}/coupons</td>
      <td class="code-text">
```json
{
  "couponType": "DISCOUNT_10PERCENT"
}
```
      </td>
      <td class="code-text">
```json
{
  "couponId": 10,
  "userId": 1,
  "couponType": "DISCOUNT_10PERCENT",
  "discountRate": 10,
  "expiryDate": "2024-12-31",
  "isUsed": false
}
```
      </td>
      <td class="text-center">
        <span class="error-critical">쿠폰 소진</span>
      </td>
    </tr>
    <tr>
      <td class="text-bold">보유 쿠폰 조회</td>
      <td class="text-center">
        <span class="method-get">GET</span>
      </td>
      <td class="code-text">/users/{userId}/coupons</td>
      <td class="code-text">없음</td>
      <td class="code-text">
```json
[
  {
    "couponId": 10,
    "userId": 1,
    "couponType": "DISCOUNT_10PERCENT",
    "discountRate": 10,
    "expiryDate": "2024-12-31",
    "isUsed": false
  }
]
```
      </td>
      <td class="text-center">-</td>
    </tr>
    <tr>
      <td class="text-bold">인기 판매 상품 조회</td>
      <td class="text-center">
        <span class="method-get">GET</span>
      </td>
      <td class="code-text">/products/top-sellers</td>
      <td class="code-text">없음</td>
      <td class="code-text">
```json
[
  {
    "id": 1,
    "name": "커피",
    "price": 3000,
    "salesCount": 150,
    "totalRevenue": 450000
  }
]
```
      </td>
      <td class="text-center">-</td>
    </tr>
  </tbody>
</table>

### HTTP Method
- 🟢 **POST** : 데이터 생성/수정
- 🔵 **GET** : 데이터 조회
- 🟡 **PUT** : 데이터 전체 수정/교체
- 🟠 **PATCH** : 데이터 일부 수정
- 🔴 **DELETE** : 데이터 삭제
- ⚪ **HEAD** : 메타데이터 조회
- 🟣 **OPTIONS** : 지원하는 메서드 조회