import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { Product } from '../../../domain/entities/product.entity';

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsServiceInterface {
  getProducts(): Promise<Product[]>;
  getTopSellers(): Promise<Product[]>;
} 