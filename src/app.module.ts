import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionInterceptor } from './common/interceptors/transaction.interceptor';
import { OptimisticLockInterceptor } from './common/interceptors/optimistic-lock.interceptor';
import { PessimisticLockInterceptor } from './common/interceptors/pessimistic-lock.interceptor';
import { DbPessimisticLockInterceptor } from './common/interceptors/db-pessimistic-lock.interceptor';
import { DbOptimisticLockInterceptor } from './common/interceptors/db-optimistic-lock.interceptor';
import { UsersController } from './presentation/controllers/users.controller';
import { ProductsController } from './presentation/controllers/products.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { CouponsController } from './presentation/controllers/coupons.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersService } from './infrastructure/services/user.service';
import { ProductsService } from './infrastructure/services/product.service';
import { OrdersService } from './infrastructure/services/order.service';
import { CouponsService } from './infrastructure/services/coupon.service';
import { PaymentsService } from './infrastructure/services/payment.service';
import { AuthService } from './infrastructure/services/auth.service';
import { USERS_SERVICE } from './application/interfaces/services/user-service.interface';
import { PRODUCTS_SERVICE } from './application/interfaces/services/product-service.interface';
import { ORDERS_SERVICE } from './application/interfaces/services/order-service.interface';
import { COUPONS_SERVICE } from './application/interfaces/services/coupon-service.interface';
import { PAYMENTS_SERVICE } from './application/interfaces/services/payment-service.interface';
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
import { RANKING_LOG_REPOSITORY } from './application/interfaces/repositories/ranking-log-repository.interface';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { CouponRepository } from './infrastructure/repositories/coupon.repository';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { ProductSalesAggregationRepository } from './infrastructure/repositories/product-sales-aggregation.repository';
import { RankingLogRepository } from './infrastructure/repositories/ranking-log.repository';
import { RedisService } from './infrastructure/services/redis.service';
import { RedisDistributedLockService } from './infrastructure/services/redis-distributed-lock.service';
import { RedisServiceInterface, REDIS_SERVICE } from './application/interfaces/services/redis-service.interface';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from './application/interfaces/services/redis-distributed-lock-service.interface';
import { EventBus } from './common/events/event-bus';
import { DataPlatformService } from './infrastructure/services/data-platform.service';
import { PaymentCompletedHandler } from './infrastructure/event-handlers/payment-events.handler';
import { UserEntity } from './infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from './infrastructure/repositories/typeorm/product.entity';
import { OrderEntity } from './infrastructure/repositories/typeorm/order.entity';
import { CouponEntity } from './infrastructure/repositories/typeorm/coupon.entity';
import { PaymentEntity } from './infrastructure/repositories/typeorm/payment.entity';
import { ProductSalesAggregationEntity } from './infrastructure/repositories/typeorm/product-sales-aggregation.entity';
import { RankingLogEntity } from './infrastructure/repositories/typeorm/ranking-log.entity';
import { OrderValidationService } from './domain/services/order-validation.service';
import { UserValidationService } from './domain/services/user-validation.service';
import { PaymentValidationService } from './domain/services/payment-validation.service';
import { CouponValidationService } from './domain/services/coupon-validation.service';
import { ProductValidationService } from './domain/services/product-validation.service';
import { AuthValidationService } from './domain/services/auth-validation.service';
import { PaymentCompletedEvent } from './domain/events/payment-completed.event';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      UserEntity,
      ProductEntity,
      OrderEntity,
      CouponEntity,
      PaymentEntity,
      ProductSalesAggregationEntity,
      RankingLogEntity
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
    {
      provide: RANKING_LOG_REPOSITORY,
      useClass: RankingLogRepository,
    },
    
    // Redis 서비스
    {
      provide: REDIS_SERVICE,
      useClass: RedisService,
    },
    {
      provide: REDIS_DISTRIBUTED_LOCK_SERVICE,
      useClass: RedisDistributedLockService,
    },
    
    // 도메인 서비스들
    OrderValidationService,
    UserValidationService,
    PaymentValidationService,
    CouponValidationService,
    ProductValidationService,
    AuthValidationService,
    
    // 이벤트 시스템
    EventBus,
    DataPlatformService,
    PaymentCompletedHandler,
    
    // 트랜잭션 인터셉터
    TransactionInterceptor,
    OptimisticLockInterceptor,
    PessimisticLockInterceptor,
    DbPessimisticLockInterceptor,
    DbOptimisticLockInterceptor,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    // 이벤트 핸들러 등록
    this.eventBus.subscribe(PaymentCompletedEvent, (event: PaymentCompletedEvent) => {
      const handler = new PaymentCompletedHandler(new DataPlatformService());
      handler.handle(event);
    });
  }
}