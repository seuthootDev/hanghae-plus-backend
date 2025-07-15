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
      int userId "유저 아이디 (애플리케이션 레벨 검증)"
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
      int userId "유저 아이디 (애플리케이션 레벨 검증)"
      string couponType
      int discountRate "할인율"
      date expiryDate
      boolean isUsed
    }
    ORDER {
      int orderId PK
      int userId "유저 아이디 (애플리케이션 레벨 검증)"
      int couponId "사용한 쿠폰 (nullable, 애플리케이션 레벨 검증)"
      date orderDate
      string status
      int totalAmount
      int discountAmount
      int finalAmount
    }
    ORDER_ITEM {
      int orderItemId PK
      int orderId "주문 아이디 (애플리케이션 레벨 검증)"
      int productId "상품 아이디 (애플리케이션 레벨 검증)"
      int quantity
      int price
      int subtotal
    }
    PAYMENT {
      int paymentId PK
      int orderId "주문 아이디 (애플리케이션 레벨 검증)"
      int totalAmount
      int discountAmount
      int finalAmount
      boolean couponUsed
      string status
      date paidAt
    }