import { Product } from '../../../domain/entities/product.entity';

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsServiceInterface {
  getProducts(): Promise<Product[]>;
  getTopSellers(): Promise<Product[]>;
  validateAndReserveProducts(items: { productId: number; quantity: number }[]): Promise<{
    products: Product[];
    orderItems: { productId: number; quantity: number; price: number }[];
    totalAmount: number;
  }>;
  findById(productId: number): Promise<Product | null>;
  save(product: Product): Promise<Product>;
} 