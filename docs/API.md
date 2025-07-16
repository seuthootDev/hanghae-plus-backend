# API 명세서

<table>
  <thead>
    <tr>
      <th></th>
      <th>기능</th>
      <th>Method</th>
      <th>Endpoint</th>
      <th>요청 예시</th>
      <th>응답 예시</th>
      <th>예외</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>포인트트 충전</td>
      <td>POST</td>
      <td>/users/{userId}/points</td>
      <td>
<pre><code>{
  "amount": 10000
}</code></pre>
      </td>
      <td>
<pre><code>{
  "userId": 1,
  "balance": 15000
}</code></pre>
      </td>
      <td>최소,최대 금액</td>
    </tr>
    <tr>
      <td>2</td>
      <td>포인트 조회</td>
      <td>GET</td>
      <td>/users/{userId}/points</td>
      <td>없음</td>
      <td>
<pre><code>{
  "userId": 1,
  "balance": 15000
}</code></pre>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td>3</td>
      <td>상품 목록 조회</td>
      <td>GET</td>
      <td>/products</td>
      <td>없음</td>
      <td>
<pre><code>[
  {
    "id": 1,
    "name": "커피",
    "price": 3000,
    "stock": 100,
    "category": "음료"
  }
]</code></pre>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td>4</td>
      <td>주문 생성</td>
      <td>POST</td>
      <td>/orders</td>
      <td>
<pre><code>{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "couponId": 10
}</code></pre>
      </td>
      <td>
<pre><code>{
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
}</code></pre>
      </td>
      <td>재고 부족</td>
    </tr>
    <tr>
      <td>5</td>
      <td>결제 처리</td>
      <td>POST</td>
      <td>/payments/process</td>
      <td>
<pre><code>{
  "orderId": 100
}</code></pre>
      </td>
      <td>
<pre><code>{
  "paymentId": 1,
  "orderId": 100,
  "totalAmount": 6000,
  "discountAmount": 600,
  "finalAmount": 5400,
  "couponUsed": true,
  "status": "SUCCESS",
  "paidAt": "2024-01-15T10:30:00Z"
}</code></pre>
      </td>
      <td>잔액 부족</td>
    </tr>
    <tr>
      <td>6</td>
      <td>쿠폰 발급</td>
      <td>POST</td>
      <td>/coupons/issue</td>
      <td>
<pre><code>{
  "userId": 1,
  "couponType": "DISCOUNT_10PERCENT"
}</code></pre>
      </td>
      <td>
<pre><code>{
  "couponId": 10,
  "userId": 1,
  "couponType": "DISCOUNT_10PERCENT",
  "discountRate": 10,
  "expiryDate": "2024-12-31",
  "isUsed": false
}</code></pre>
      </td>
      <td>쿠폰 소진</td>
    </tr>
    <tr>
      <td>7</td>
      <td>보유 쿠폰 조회</td>
      <td>GET</td>
      <td>/coupons/user/{userId}</td>
      <td>없음</td>
      <td>
<pre><code>[
  {
    "couponId": 10,
    "userId": 1,
    "couponType": "DISCOUNT_10PERCENT",
    "discountRate": 10,
    "expiryDate": "2024-12-31",
    "isUsed": false
  }
]</code></pre>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td>8</td>
      <td>인기 판매 상품 조회</td>
      <td>GET</td>
      <td>/products/top-sellers</td>
      <td>없음</td>
      <td>
<pre><code>[
  {
    "id": 1,
    "name": "커피",
    "price": 3000,
    "salesCount": 150,
    "totalRevenue": 450000
  }
]</code></pre>
      </td>
      <td>-</td>
    </tr>
  </tbody>
</table>

### HTTP Method
- **POST** : 데이터 생성/수정
- **GET** : 데이터 조회
- **PUT** : 데이터 전체 수정/교체
- **PATCH** : 데이터 일부 수정
- **DELETE** : 데이터 삭제
- **HEAD** : 메타데이터 조회
- **OPTIONS** : 지원하는 메서드 조회