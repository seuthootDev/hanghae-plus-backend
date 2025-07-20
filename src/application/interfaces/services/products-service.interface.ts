import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsServiceInterface {
  getProducts(): Promise<ProductResponseDto[]>;
  getTopSellers(): Promise<TopSellerResponseDto[]>;
} 