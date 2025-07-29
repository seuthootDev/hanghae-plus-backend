import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ length: 50 })
  couponType: string;

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