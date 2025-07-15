```mermaid
classDiagram
    %% 도메인 모델 (Entity)
    class User {
        +int id
        +string name
        +Point point
        +getPoint()
        +chargePoint(amount)
    }
    class Point {
        +int amount
        +charge(amount)
        +deduct(amount)
        +getAmount()
    }
    class Product {
        +int id
        +string name
        +int price
        +int stock
        +string category
        +getStock()
        +deductStock(quantity)
    }
    class Order {
        +int id
        +int userId
        +OrderItem[] items
        +int totalAmount
        +int discountAmount
        +int finalAmount
        +string status
        +int? couponId
    }
    class OrderItem {
        +int productId
        +int quantity
        +int price
        +int subtotal
    }
    class Coupon {
        +int id
        +int userId
        +string couponType
        +int discountRate
        +date expiryDate
        +bool isUsed
        +assignTo(user)
        +use()
    }
    class Payment {
        +int orderId
        +int userId
        +int totalAmount
        +int discountAmount
        +int finalAmount
        +bool couponUsed
        +string status
        +datetime paymentDate
    }

    %% 서비스 클래스 (비즈니스 로직)
    class UserService {
        +getUser(id)
        +chargePoint(userId, amount)
        +getPoint(userId)
    }
    class OrderService {
        +createOrder(userId, items, couponId)
        +getOrder(orderId)
        +getOrders(userId)
    }
    class PaymentService {
        +processPayment(orderId, userId, couponId)
        +getPayment(orderId)
    }
    class CouponService {
        +issueCoupon(userId, couponType)
        +getUserCoupons(userId)
        +useCoupon(couponId)
        +validateCoupon(couponId)
    }
    class ProductService {
        +getProducts()
        +getProduct(id)
        +getTopSellers()
    }

    %% 관계
    User "1" o-- "*" Coupon
    User "1" o-- "1" Point
    User "1" o-- "*" Order
    User "1" o-- "*" Payment
    Order "1" o-- "*" OrderItem
    Order "1" o-- "1" Payment
    Order "0..1" --> "1" Coupon

    %% 서비스와 도메인 모델 관계
    UserService --> User
    OrderService --> Order
    PaymentService --> Payment
    CouponService --> Coupon
    ProductService --> Product

    %% 서비스 간 의존성
    OrderService --> CouponService
    UserService --> CouponService