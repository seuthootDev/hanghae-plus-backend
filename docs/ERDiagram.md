```mermaid
erDiagram
    USER ||--o{ POINT : owns
    USER ||--o{ COUPON : "has"
    USER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    ORDER }|..|{ PAYMENT : "paid by"
    ORDER }|..|{ COUPON : "uses"

    USER {
      int userId PK "유저 아이디"
      string name
    }
    POINT {
      int userId FK "유저 아이디"
      int amount "포인트"
    }
    PRODUCT {
      int productId PK
      string name
      int price
      int stock "재고"
      string category
    }
    COUPON {
      int couponId PK
      int userId FK
      string couponType
      int discountRate "할인율"
      date expiryDate
      boolean isUsed
    }
    ORDER {
      int orderId PK
      int userId FK
      int couponId FK "사용한 쿠폰 (nullable)"
      date orderDate
      string status
      int totalAmount
      int discountAmount
      int finalAmount
    }
    ORDER_ITEM {
      int orderItemId PK
      int orderId FK
      int productId FK
      int quantity
      int price
      int subtotal
    }
    PAYMENT {
      int paymentId PK
      int orderId FK
      int totalAmount
      int discountAmount
      int finalAmount
      boolean couponUsed
      string status
      date paidAt
    }