import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ranking_logs')
export class RankingLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'coupon_type', type: 'varchar', length: 50 })
  couponType: string;

  @Column({ type: 'int' })
  rank: number;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ 
    type: 'enum', 
    enum: ['ISSUED', 'FAILED'], 
    default: 'ISSUED' 
  })
  status: 'ISSUED' | 'FAILED';

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;
}
