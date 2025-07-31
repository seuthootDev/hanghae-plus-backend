```mermaid
erDiagram
    USER ||--o{ COUPON : "has"
    USER ||--o{ ORDER : "places"
    PRODUCT ||--o{ PRODUCT_SALES_AGGREGATION : "aggregated in"
    ORDER }|..|{ PAYMENT : "paid by"
    ORDER }|..|{ COUPON : "uses"

    USER {
      int id PK "유저 아이디"
      string email "이메일 (unique)"
      string name "이름"
      int points "포인트"
      string password "비밀번호"
      datetime createdAt "생성일시"
      datetime updatedAt "수정일시"
    }
    
    PRODUCT {
      int id PK "상품 아이디"
      string name "상품명"
      int price "가격"
      int stock "재고"
      string category "카테고리"
      datetime createdAt "생성일시"
      datetime updatedAt "수정일시"
    }
    
    PRODUCT_SALES_AGGREGATION {
      int id PK "집계 아이디"
      int productId "상품 아이디"
      int salesCount "판매 수량"
      int totalRevenue "총 매출"
      datetime lastUpdated "마지막 업데이트"
    }
    
    COUPON {
      int id PK "쿠폰 아이디"
      int userId "유저 아이디"
      string couponType "쿠폰 타입"
      int discountRate "할인율"
      int discountAmount "할인 금액"
      datetime expiryDate "만료일"
      boolean isUsed "사용 여부"
      datetime createdAt "생성일시"
      datetime updatedAt "수정일시"
    }
    
    ORDER {
      int id PK "주문 아이디"
      int userId "유저 아이디"
      json items "주문 상품 목록"
      int totalAmount "총 금액"
      int discountAmount "할인 금액"
      int finalAmount "최종 금액"
      int couponId "사용한 쿠폰 (nullable)"
      boolean couponUsed "쿠폰 사용 여부"
      string status "주문 상태"
      datetime createdAt "생성일시"
      datetime updatedAt "수정일시"
    }
    
    PAYMENT {
      int id PK "결제 아이디"
      int orderId "주문 아이디"
      int userId "유저 아이디"
      int totalAmount "총 금액"
      int discountAmount "할인 금액"
      int finalAmount "최종 금액"
      boolean couponUsed "쿠폰 사용 여부"
      string status "결제 상태"
      datetime paidAt "결제일시 (nullable)"
      datetime createdAt "생성일시"
      datetime updatedAt "수정일시"
    }