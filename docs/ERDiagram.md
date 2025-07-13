```mermaid
erDiagram
    USER ||--o{ BALANCE : owns
    USER ||--o{ COUPON : "has"
    USER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--o{ COUPON : "discount for"
    ORDER }|..|{ PAYMENT : "paid by"
    ORDER }|..|{ COUPON : "uses"

    USER {
      string userId PK "유저 아이디"
      string name
    }
    BALANCE {
      string userId FK "유저 아이디"
      int amount "잔액"
    }
    PRODUCT {
      string productId PK
      string name
      int price
      int stock "재고"
    }
    COUPON {
      string couponId PK
      string userId FK
      string productId FK
      float discountRate "할인율"
      boolean used
    }
    ORDER {
      string orderId PK
      string userId FK
      date orderDate
      string status
    }
    ORDER_ITEM {
      string orderItemId PK
      string orderId FK
      string productId FK
      int quantity
      int unitPrice
    }
    PAYMENT {
      string paymentId PK
      string orderId FK
      int amount
      date paidAt
      string status
    }