import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('product_sales_aggregation')
export class ProductSalesAggregationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'sales_count', type: 'int', default: 0 })
  salesCount: number;

  @Column({ name: 'total_revenue', type: 'int', default: 0 })
  totalRevenue: number;

  @Column({ name: 'last_updated', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
} 