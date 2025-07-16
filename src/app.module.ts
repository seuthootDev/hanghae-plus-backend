import { Module } from "@nestjs/common";
// import { DatabaseModule } from "./database/database.module";
import { UsersController } from "./users/users.controller";
import { ProductsController } from "./products/products.controller";
import { OrdersController } from "./orders/orders.controller";
import { CouponsController } from "./coupons/coupons.controller";
import { PointsController } from "./points/points.controller";
import { PaymentsController } from "./payments/payments.controller";

@Module({
  imports: [], // DatabaseModule 주석처리
  controllers: [
    UsersController,
    ProductsController,
    OrdersController,
    CouponsController,
    PointsController,
    PaymentsController
  ],
  providers: [],
})
export class AppModule {}
