import { Injectable, Inject } from '@nestjs/common';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';
import { ProductPresenterInterface, PRODUCT_PRESENTER } from '../../interfaces/presenters/product-presenter.interface';

@Injectable()
export class GetTopSellersUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(PRODUCT_PRESENTER)
    private readonly productPresenter: ProductPresenterInterface
  ) {}

  async execute(): Promise<TopSellerResponseDto[]> {
    const products = await this.productsService.getTopSellers();
    return products.map(product => this.productPresenter.presentTopSeller(product));
  }
} 