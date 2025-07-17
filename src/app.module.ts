import { Module } from "@nestjs/common";
// import { DatabaseModule } from "./database/database.module";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { ProductsController } from "./products/products.controller";
import { ProductsService } from "./products/products.service";
import { OrdersController } from "./orders/orders.controller";
import { OrdersService } from "./orders/orders.service";
import { CouponsController } from "./coupons/coupons.controller";
import { CouponsService } from "./coupons/coupons.service";
import { PaymentsController } from "./payments/payments.controller";
import { PaymentsService } from "./payments/payments.service";

@Module({
  imports: [], // DatabaseModule 주석처리
  controllers: [
    UsersController,
    ProductsController,
    OrdersController,
    CouponsController,
    PaymentsController
  ],
  providers: [
    UsersService,
    ProductsService,
    OrdersService,
    CouponsService,
    PaymentsService
  ],
})
export class AppModule {}
