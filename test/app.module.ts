import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../src/presentation/controllers/users.controller';
import { ProductsController } from '../src/presentation/controllers/products.controller';
import { OrdersController } from '../src/presentation/controllers/orders.controller';
import { CouponsController } from '../src/presentation/controllers/coupons.controller';
import { PaymentsController } from '../src/presentation/controllers/payments.controller';
import { AuthController } from '../src/presentation/controllers/auth.controller';
import { UsersService } from '../src/infrastructure/services/users.service';
import { ProductsService } from '../src/infrastructure/services/products.service';
import { OrdersService } from '../src/infrastructure/services/orders.service';
import { CouponsService } from '../src/infrastructure/services/coupons.service';
import { PaymentsService } from '../src/infrastructure/services/payments.service';
import { AuthService } from '../src/infrastructure/services/auth.service';
import { USERS_SERVICE } from '../src/application/interfaces/services/users-service.interface';
import { PRODUCTS_SERVICE } from '../src/application/interfaces/services/products-service.interface';
import { ORDERS_SERVICE } from '../src/application/interfaces/services/orders-service.interface';
import { COUPONS_SERVICE } from '../src/application/interfaces/services/coupons-service.interface';
import { PAYMENTS_SERVICE } from '../src/application/interfaces/services/payments-service.interface';
import { AUTH_SERVICE } from '../src/application/interfaces/services/auth-service.interface';
import { ChargePointsUseCase } from '../src/application/use-cases/users/charge-points.use-case';
import { GetUserPointsUseCase } from '../src/application/use-cases/users/get-user-points.use-case';
import { GetProductsUseCase } from '../src/application/use-cases/products/get-products.use-case';
import { GetTopSellersUseCase } from '../src/application/use-cases/products/get-top-sellers.use-case';
import { CreateOrderUseCase } from '../src/application/use-cases/orders/create-order.use-case';
import { IssueCouponUseCase } from '../src/application/use-cases/coupons/issue-coupon.use-case';
import { GetUserCouponsUseCase } from '../src/application/use-cases/coupons/get-user-coupons.use-case';
import { ProcessPaymentUseCase } from '../src/application/use-cases/payments/process-payment.use-case';
import { RegisterUseCase } from '../src/application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../src/application/use-cases/auth/login.use-case';
import { ValidateTokenUseCase } from '../src/application/use-cases/auth/validate-token.use-case';
import { USER_REPOSITORY } from '../src/application/interfaces/repositories/user-repository.interface';
import { PRODUCT_REPOSITORY } from '../src/application/interfaces/repositories/product-repository.interface';
import { ORDER_REPOSITORY } from '../src/application/interfaces/repositories/order-repository.interface';
import { COUPON_REPOSITORY } from '../src/application/interfaces/repositories/coupon-repository.interface';
import { PAYMENT_REPOSITORY } from '../src/application/interfaces/repositories/payment-repository.interface';
import { UserRepository } from '../src/infrastructure/repositories/user.repository';
import { ProductRepository } from '../src/infrastructure/repositories/product.repository';
import { OrderRepository } from '../src/infrastructure/repositories/order.repository';
import { CouponRepository } from '../src/infrastructure/repositories/coupon.repository';
import { PaymentRepository } from '../src/infrastructure/repositories/payment.repository';
import { UserEntity } from '../src/infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../src/infrastructure/repositories/typeorm/product.entity';
import { OrderEntity } from '../src/infrastructure/repositories/typeorm/order.entity';
import { CouponEntity } from '../src/infrastructure/repositories/typeorm/coupon.entity';
import { PaymentEntity } from '../src/infrastructure/repositories/typeorm/payment.entity';
import { OrderValidationService } from '../src/domain/services/order-validation.service';
import { UserValidationService } from '../src/domain/services/user-validation.service';
import { PaymentValidationService } from '../src/domain/services/payment-validation.service';
import { CouponValidationService } from '../src/domain/services/coupon-validation.service';
import { ProductValidationService } from '../src/domain/services/product-validation.service';
import { AuthValidationService } from '../src/domain/services/auth-validation.service';
import { TestSeeder } from './database/test-seeder';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [UserEntity, ProductEntity, OrderEntity, CouponEntity, PaymentEntity],
      synchronize: true,
      logging: false,
      dropSchema: true,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      ProductEntity,
      OrderEntity,
      CouponEntity,
      PaymentEntity
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
    
    // 도메인 서비스들
    OrderValidationService,
    UserValidationService,
    PaymentValidationService,
    CouponValidationService,
    ProductValidationService,
    AuthValidationService,
    
    // TestSeeder 추가
    TestSeeder,
  ],
})
export class TestAppModule {} 