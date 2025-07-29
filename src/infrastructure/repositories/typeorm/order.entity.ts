import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { CouponEntity } from './coupon.entity';
import { PaymentEntity } from './payment.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'json' })
  items: any[];

  @Column({ type: 'int' })
  totalAmount: number;

  @Column({ type: 'int', default: 0 })
  discountAmount: number;

  @Column({ type: 'int' })
  finalAmount: number;

  @Column({ type: 'int', nullable: true })
  couponId: number;

  @Column({ type: 'boolean', default: false })
  couponUsed: boolean;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => CouponEntity, coupon => coupon.orders, { nullable: true })
  @JoinColumn({ name: 'couponId' })
  coupon: CouponEntity;

  @OneToOne(() => PaymentEntity, payment => payment.order)
  payment: PaymentEntity;
} 