import { Injectable, Inject } from '@nestjs/common';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';
import { RedisService } from '../../../infrastructure/services/redis.service';
import { ProductSalesAggregationRepositoryInterface } from '../../interfaces/repositories/product-sales-aggregation-repository.interface';

@Injectable()
export class GetTopSellersUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    private readonly redisService: RedisService,
    @Inject('PRODUCT_SALES_AGGREGATION_REPOSITORY')
    private readonly aggregationRepository: ProductSalesAggregationRepositoryInterface
  ) {}

  async execute(): Promise<TopSellerResponseDto[]> {
    // Redis 캐시에서 먼저 조회
    const cached = await this.redisService.getTopSellersCache();
    if (cached) {
      return cached;
    }

    // 캐시가 없으면 집계 테이블에서 조회
    const topSellers = await this.aggregationRepository.findTopSellers(5);
    
    // 상품 정보와 함께 조합
    const products = await this.productsService.getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));
    
    const result = topSellers
      .map(aggregation => productMap.get(aggregation.productId))
      .filter(product => product !== undefined)
      .map(product => ({
        id: product.id,
        name: product.name,
        price: product.price
      }));

    // Redis에 캐시 저장
    await this.redisService.setTopSellersCache(result);
    
    return result;
  }
} 