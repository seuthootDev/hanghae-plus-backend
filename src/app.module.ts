import { Module } from '@nestjs/common';
// import { DatabaseModule } from './database/database.module';
import { UsersController } from './presentation/controllers/users.controller';
import { ProductsController } from './presentation/controllers/products.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { CouponsController } from './presentation/controllers/coupons.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { UsersService } from './infrastructure/services/real/users.service';
import { ProductsService } from './infrastructure/services/real/products.service';
import { OrdersService } from './infrastructure/services/real/orders.service';
import { CouponsService } from './infrastructure/services/real/coupons.service';
import { PaymentsService } from './infrastructure/services/real/payments.service';
import { USERS_SERVICE } from './application/interfaces/services/users-service.interface';
import { PRODUCTS_SERVICE } from './application/interfaces/services/products-service.interface';
import { ORDERS_SERVICE } from './application/interfaces/services/orders-service.interface';
import { COUPONS_SERVICE } from './application/interfaces/services/coupons-service.interface';
import { PAYMENTS_SERVICE } from './application/interfaces/services/payments-service.interface';
import { ChargePointsUseCase } from './application/use-cases/charge-points.use-case';
import { GetUserPointsUseCase } from './application/use-cases/get-user-points.use-case';

@Module({
  imports: [],
  controllers: [
    UsersController,
    ProductsController,
    OrdersController,
    CouponsController,
    PaymentsController
  ],
  providers: [
    // 유스케이스들
    ChargePointsUseCase,
    GetUserPointsUseCase,
    
    // 인터페이스와 구현체 연결 (의존성 역전)
    {
      provide: USERS_SERVICE,
      useClass: UsersService,
    },
    {
      provide: PRODUCTS_SERVICE,
      useClass: ProductsService,
    },
    {
      provide: ORDERS_SERVICE,
      useClass: OrdersService,
    },
    {
      provide: COUPONS_SERVICE,
      useClass: CouponsService,
    },
    {
      provide: PAYMENTS_SERVICE,
      useClass: PaymentsService,
    },
  ],
})
export class AppModule {}
