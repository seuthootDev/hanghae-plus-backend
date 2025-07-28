import { Injectable, Inject } from '@nestjs/common';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';
import { ProductPresenterInterface, PRODUCT_PRESENTER } from '../../interfaces/presenters/product-presenter.interface';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(PRODUCT_PRESENTER)
    private readonly productPresenter: ProductPresenterInterface
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.getProducts();
    return this.productPresenter.presentProductList(products);
  }
} 