import { Product } from '../../../domain/entities/product.entity';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';

export const PRODUCT_PRESENTER = 'PRODUCT_PRESENTER';

export interface ProductPresenterInterface {
  presentProduct(product: Product): ProductResponseDto;
  presentProductList(products: Product[]): ProductResponseDto[];
  presentTopSeller(product: Product): TopSellerResponseDto;
} 