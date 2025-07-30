import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryInterface } from '../../application/interfaces/repositories/product-repository.interface';
import { ProductEntity } from './typeorm/product.entity';

@Injectable()
export class ProductRepository implements ProductRepositoryInterface {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>
  ) {}

  async findById(id: number): Promise<Product | null> {
    const productEntity = await this.productRepository.findOne({ where: { id } });
    if (!productEntity) {
      return null;
    }
    
    return new Product(
      productEntity.id,
      productEntity.name,
      productEntity.price,
      productEntity.stock,
      productEntity.category,
      productEntity.salesCount,
      productEntity.totalRevenue
    );
  }

  async findAll(): Promise<Product[]> {
    const productEntities = await this.productRepository.find();
    
    return productEntities.map(entity => new Product(
      entity.id,
      entity.name,
      entity.price,
      entity.stock,
      entity.category,
      entity.salesCount,
      entity.totalRevenue
    ));
  }

  async findTopSellers(): Promise<Product[]> {
    const topSellerEntities = await this.productRepository
      .createQueryBuilder('product')
      .where('product.salesCount > :salesCount', { salesCount: 50 })
      .getMany();
    
    return topSellerEntities.map(entity => new Product(
      entity.id,
      entity.name,
      entity.price,
      entity.stock,
      entity.category,
      entity.salesCount,
      entity.totalRevenue
    ));
  }

  async save(product: Product): Promise<Product> {
    const productEntity = this.productRepository.create({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue
    });
    
    const savedEntity = await this.productRepository.save(productEntity);
    
    return new Product(
      savedEntity.id,
      savedEntity.name,
      savedEntity.price,
      savedEntity.stock,
      savedEntity.category,
      savedEntity.salesCount,
      savedEntity.totalRevenue
    );
  }
} 