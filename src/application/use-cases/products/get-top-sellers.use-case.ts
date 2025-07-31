import { Injectable, Inject } from '@nestjs/common';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';

@Injectable()
export class GetTopSellersUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface
  ) {}

  async execute(): Promise<TopSellerResponseDto[]> {
    const products = await this.productsService.getTopSellers();
    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue
    }));
  }
} 