import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../src/infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../../src/infrastructure/repositories/typeorm/product.entity';
import { OrderEntity } from '../../src/infrastructure/repositories/typeorm/order.entity';
import { CouponEntity } from '../../src/infrastructure/repositories/typeorm/coupon.entity';
import { PaymentEntity } from '../../src/infrastructure/repositories/typeorm/payment.entity';
import { TestSeeder } from './test-seeder';

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
    TypeOrmModule.forFeature([UserEntity, ProductEntity, OrderEntity, CouponEntity, PaymentEntity]),
  ],
  providers: [TestSeeder],
  exports: [TestSeeder],
})
export class TestDatabaseModule {} 