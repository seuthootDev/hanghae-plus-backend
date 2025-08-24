import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { OrderEntity } from './order.entity';
import { CouponType } from '../../../domain/entities/coupon.entity';

@Entity('coupons')
@Index(['userId'])
@Index(['isUsed'])
export class CouponEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ length: 50 })
  couponType: CouponType;

  @Column({ type: 'int', default: 0 })
  discountRate: number;

  @Column({ type: 'int', default: 0 })
  discountAmount: number;

  @Column({ type: 'datetime' })
  expiryDate: Date;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderEntity, order => order.coupon)
  orders: OrderEntity[];
} 