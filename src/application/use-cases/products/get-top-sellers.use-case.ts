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
    return this.productsService.getTopSellers();
  }
} 