import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryInterface } from '../../application/interfaces/repositories/product-repository.interface';

@Injectable()
export class ProductRepository implements ProductRepositoryInterface {
  private products: Map<number, Product> = new Map();

  constructor() {
    // Mock 데이터 초기화
    this.products.set(1, new Product(1, '아메리카노', 3000, 100, '음료', 150, 450000));
    this.products.set(2, new Product(2, '카페라떼', 4000, 80, '음료', 120, 480000));
    this.products.set(3, new Product(3, '치킨샌드위치', 8000, 50, '식품', 80, 640000));
    this.products.set(4, new Product(4, '에스프레소', 2000, 120, '음료', 200, 400000));
    this.products.set(5, new Product(5, '티셔츠', 15000, 30, '의류', 25, 375000));
  }

  async findById(id: number): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async findTopSellers(): Promise<Product[]> {
    const allProducts = Array.from(this.products.values());
    return allProducts.filter(product => product.isTopSeller());
  }
} 