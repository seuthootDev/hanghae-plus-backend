import { Product } from '../../../domain/entities/product.entity';

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsServiceInterface {
  getProducts(): Promise<Product[]>;
} 