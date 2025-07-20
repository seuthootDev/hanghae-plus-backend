import { Injectable, Inject } from '@nestjs/common';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    return this.productsService.getProducts();
  }
} 