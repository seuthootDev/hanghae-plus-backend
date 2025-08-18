import { Injectable, Inject } from '@nestjs/common';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    // Redis 캐시에서 먼저 조회 (에러 처리 포함)
    try {
      const cached = await this.redisService.getProductsCache();
      if (cached) {
        console.log('✅ Redis 캐시에서 상품 목록 조회 성공');
        return cached;
      }
    } catch (error) {
      console.warn('⚠️ Redis 캐시 조회 실패, DB에서 조회:', error.message);
    }

    // 캐시가 없거나 실패하면 DB에서 조회
    try {
      const products = await this.productsService.getProducts();
      const result = products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category
      }));

      // Redis에 캐시 저장 (에러 처리 포함, TTL: 10분)
      try {
        await this.redisService.setProductsCache(result, 600);
        console.log('✅ Redis 캐시에 상품 목록 저장 성공');
      } catch (cacheError) {
        console.warn('⚠️ Redis 캐시 저장 실패:', cacheError.message);
        // 캐시 저장 실패해도 결과는 반환
      }

      return result;
    } catch (error) {
      console.error('❌ 상품 목록 조회 실패:', error.message);
      throw new Error('상품 목록을 조회할 수 없습니다.');
    }
  }
} 