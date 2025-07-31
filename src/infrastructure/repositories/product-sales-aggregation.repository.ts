import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSalesAggregation } from '../../domain/entities/product-sales-aggregation.entity';
import { ProductSalesAggregationRepositoryInterface } from '../../application/interfaces/repositories/product-sales-aggregation-repository.interface';
import { ProductSalesAggregationEntity } from './typeorm/product-sales-aggregation.entity';

@Injectable()
export class ProductSalesAggregationRepository implements ProductSalesAggregationRepositoryInterface {
  constructor(
    @InjectRepository(ProductSalesAggregationEntity)
    private readonly aggregationRepository: Repository<ProductSalesAggregationEntity>
  ) {}

  async findByProductId(productId: number): Promise<ProductSalesAggregation | null> {
    const entity = await this.aggregationRepository.findOne({ where: { productId } });
    if (!entity) {
      return null;
    }

    return new ProductSalesAggregation(
      entity.id,
      entity.productId,
      entity.salesCount,
      entity.totalRevenue,
      entity.lastUpdated
    );
  }

  async findTopSellers(limit: number): Promise<ProductSalesAggregation[]> {
    const entities = await this.aggregationRepository.find({
      order: { salesCount: 'DESC' },
      take: limit
    });

    return entities.map(entity => new ProductSalesAggregation(
      entity.id,
      entity.productId,
      entity.salesCount,
      entity.totalRevenue,
      entity.lastUpdated
    ));
  }

  async save(aggregation: ProductSalesAggregation): Promise<ProductSalesAggregation> {
    const entity = new ProductSalesAggregationEntity();
    entity.productId = aggregation.productId;
    entity.salesCount = aggregation.salesCount;
    entity.totalRevenue = aggregation.totalRevenue;
    entity.lastUpdated = aggregation.lastUpdated;

    const savedEntity = await this.aggregationRepository.save(entity);
    
    return new ProductSalesAggregation(
      savedEntity.id,
      savedEntity.productId,
      savedEntity.salesCount,
      savedEntity.totalRevenue,
      savedEntity.lastUpdated
    );
  }

  async updateSales(productId: number, salesCount: number, totalRevenue: number): Promise<ProductSalesAggregation> {
    let entity = await this.aggregationRepository.findOne({ where: { productId } });
    
    if (!entity) {
      entity = new ProductSalesAggregationEntity();
      entity.productId = productId;
      entity.salesCount = salesCount;
      entity.totalRevenue = totalRevenue;
    } else {
      entity.salesCount = salesCount;
      entity.totalRevenue = totalRevenue;
    }

    const savedEntity = await this.aggregationRepository.save(entity);
    
    return new ProductSalesAggregation(
      savedEntity.id,
      savedEntity.productId,
      savedEntity.salesCount,
      savedEntity.totalRevenue,
      savedEntity.lastUpdated
    );
  }
} 