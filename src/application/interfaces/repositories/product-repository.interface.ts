import { Product } from '../../../domain/entities/product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface ProductRepositoryInterface {
  findById(id: number): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<Product>;
} 