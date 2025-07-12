```mermaid
classDiagram
    class User {
        +int id
        +string name
        +Balance balance
        +getBalance()
        +chargeBalance(amount)
        +getCoupons()
    }
    class Balance {
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
        +getStock()
        +deductStock(quantity)
    }
    class Order {
        +int id
        +User user
        +OrderItem[] items
        +int totalPrice
        +string status
        +Coupon? coupon
        +createOrder(user, items, coupon)
        +pay()
    }
    class OrderItem {
        +Product product
        +int quantity
        +int subtotal
    }
    class Coupon {
        +int id
        +string code
        +int discount
        +bool used
        +assignTo(user)
        +use()
    }
    class DataPlatform {
        +sendOrderInfo(order)
    }

    User "1" o-- "*" Coupon
    User "1" o-- "1" Balance
    User "1" o-- "*" Order
    Order "1" o-- "*" OrderItem
    OrderItem "*" --> "1" Product
    Order "0..1" --> "1" Coupon
    Order --> DataPlatform : sendOrder