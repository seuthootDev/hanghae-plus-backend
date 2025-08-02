import { ProductSalesAggregation } from '../../../domain/entities/product-sales-aggregation.entity';

export interface ProductSalesAggregationRepositoryInterface {
  findByProductId(productId: number): Promise<ProductSalesAggregation | null>;
  findTopSellers(limit: number): Promise<ProductSalesAggregation[]>;
  save(aggregation: ProductSalesAggregation): Promise<ProductSalesAggregation>;
  updateSales(productId: number, salesCount: number, totalRevenue: number): Promise<ProductSalesAggregation>;
} 