import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionInterceptor } from './common/interceptors/transaction.interceptor';
import { UsersController } from './presentation/controllers/users.controller';
import { ProductsController } from './presentation/controllers/products.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { CouponsController } from './presentation/controllers/coupons.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersService } from './infrastructure/services/users.service';
import { ProductsService } from './infrastructure/services/products.service';
import { OrdersService } from './infrastructure/services/orders.service';
import { CouponsService } from './infrastructure/services/coupons.service';
import { PaymentsService } from './infrastructure/services/payments.service';
import { AuthService } from './infrastructure/services/auth.service';
import { USERS_SERVICE } from './application/interfaces/services/users-service.interface';
import { PRODUCTS_SERVICE } from './application/interfaces/services/products-service.interface';
import { ORDERS_SERVICE } from './application/interfaces/services/orders-service.interface';
import { COUPONS_SERVICE } from './application/interfaces/services/coupons-service.interface';
import { PAYMENTS_SERVICE } from './application/interfaces/services/payments-service.interface';
import { AUTH_SERVICE } from './application/interfaces/services/auth-service.interface';
import { ChargePointsUseCase } from './application/use-cases/users/charge-points.use-case';
import { GetUserPointsUseCase } from './application/use-cases/users/get-user-points.use-case';
import { GetProductsUseCase } from './application/use-cases/products/get-products.use-case';
import { GetTopSellersUseCase } from './application/use-cases/products/get-top-sellers.use-case';
import { CreateOrderUseCase } from './application/use-cases/orders/create-order.use-case';
import { IssueCouponUseCase } from './application/use-cases/coupons/issue-coupon.use-case';
import { GetUserCouponsUseCase } from './application/use-cases/coupons/get-user-coupons.use-case';
import { ProcessPaymentUseCase } from './application/use-cases/payments/process-payment.use-case';
import { RegisterUseCase } from './application/use-cases/auth/register.use-case';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { ValidateTokenUseCase } from './application/use-cases/auth/validate-token.use-case';
import { USER_REPOSITORY } from './application/interfaces/repositories/user-repository.interface';
import { PRODUCT_REPOSITORY } from './application/interfaces/repositories/product-repository.interface';
import { ORDER_REPOSITORY } from './application/interfaces/repositories/order-repository.interface';
import { COUPON_REPOSITORY } from './application/interfaces/repositories/coupon-repository.interface';
import { PAYMENT_REPOSITORY } from './application/interfaces/repositories/payment-repository.interface';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { ProductSalesAggregationRepository } from './infrastructure/repositories/product-sales-aggregation.repository';
import { RedisService } from './infrastructure/services/redis.service';
import { UserEntity } from './infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from './infrastructure/repositories/typeorm/product.entity';
import { OrderEntity } from './infrastructure/repositories/typeorm/order.entity';
import { CouponEntity } from './infrastructure/repositories/typeorm/coupon.entity';
import { PaymentEntity } from './infrastructure/repositories/typeorm/payment.entity';
import { ProductSalesAggregationEntity } from './infrastructure/repositories/typeorm/product-sales-aggregation.entity';
import { OrderValidationService } from './domain/services/order-validation.service';
import { UserValidationService } from './domain/services/user-validation.service';
import { PaymentValidationService } from './domain/services/payment-validation.service';
import { CouponValidationService } from './domain/services/coupon-validation.service';
import { ProductValidationService } from './domain/services/product-validation.service';
import { AuthValidationService } from './domain/services/auth-validation.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      UserEntity,
      ProductEntity,
      OrderEntity,
      CouponEntity,
      PaymentEntity,
      ProductSalesAggregationEntity
    ])
  ],
  controllers: [
    UsersController,
    ProductsController,
    OrdersController,
    CouponsController,
    PaymentsController,
    AuthController
  ],
  providers: [
    // 유스케이스들
    ChargePointsUseCase,
    GetUserPointsUseCase,
    GetProductsUseCase,
    GetTopSellersUseCase,
    CreateOrderUseCase,
    IssueCouponUseCase,
    GetUserCouponsUseCase,
    ProcessPaymentUseCase,
    RegisterUseCase,
    LoginUseCase,
    ValidateTokenUseCase,
    
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
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
    
    // 리포지토리 인터페이스와 Mock 구현체 연결
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    {
      provide: COUPON_REPOSITORY,
      useClass: CouponRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: 'PRODUCT_SALES_AGGREGATION_REPOSITORY',
      useClass: ProductSalesAggregationRepository,
    },
    
    // Redis 서비스
    RedisService,
    
    // 도메인 서비스들
    OrderValidationService,
    UserValidationService,
    PaymentValidationService,
    CouponValidationService,
    ProductValidationService,
    AuthValidationService,
    
    // 트랜잭션 인터셉터
    TransactionInterceptor,
  ],
})
export class AppModule {}