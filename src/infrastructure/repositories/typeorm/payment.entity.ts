import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, VersionColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  totalAmount: number;

  @Column({ type: 'int', default: 0 })
  discountAmount: number;

  @Column({ type: 'int' })
  finalAmount: number;

  @Column({ type: 'boolean', default: false })
  couponUsed: boolean;

  @Column({ length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => OrderEntity, order => order.payment)
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @VersionColumn()
  version: number;
} 