import { Injectable, Inject } from '@nestjs/common';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';
import { ProductSalesAggregationRepositoryInterface } from '../../interfaces/repositories/product-sales-aggregation-repository.interface';

@Injectable()
export class GetTopSellersUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface,
    @Inject('PRODUCT_SALES_AGGREGATION_REPOSITORY')
    private readonly aggregationRepository: ProductSalesAggregationRepositoryInterface
  ) {}

  async execute(): Promise<TopSellerResponseDto[]> {
    console.log('🚀 GetTopSellersUseCase 실행 시작');
    
    // Redis 캐시에서 먼저 조회 (에러 처리 포함)
    try {
      console.log('🔍 Redis 캐시에서 인기 상품 조회 시도');
      const cached = await this.redisService.getTopSellersCache();
      if (cached) {
        console.log('✅ Redis 캐시에서 인기 상품 조회 성공');
        return cached;
      }
      console.log('ℹ️ Redis 캐시에 인기 상품 데이터 없음');
    } catch (error) {
      console.warn('⚠️ Redis 캐시 조회 실패, DB에서 조회:', error.message);
    }

    // 캐시가 없거나 실패하면 집계 테이블에서 조회
    try {
      console.log('🔍 집계 테이블에서 인기 상품 조회 시도');
      const topSellers = await this.aggregationRepository.findTopSellers(5);
      console.log(`📊 집계 데이터 조회 결과: ${topSellers?.length || 0}개`);
      
      // 집계 데이터가 없으면 빈 배열 반환
      if (!topSellers || topSellers.length === 0) {
        console.log('ℹ️ 인기 상품 집계 데이터가 없습니다.');
        
        // 빈 배열도 캐시에 저장 (TTL: 5분)
        try {
          await this.redisService.setTopSellersCache([], 300);
          console.log('✅ Redis 캐시에 빈 인기 상품 배열 저장 성공');
        } catch (cacheError) {
          console.warn('⚠️ Redis 캐시 저장 실패:', cacheError.message);
        }
        
        return [];
      }
      
      // 상품 정보와 함께 조합
      console.log('🔍 상품 정보 조회 시도');
      const products = await this.productsService.getProducts();
      console.log(`📦 상품 데이터 조회 결과: ${products?.length || 0}개`);
      
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const result = topSellers
        .map(aggregation => productMap.get(aggregation.productId))
        .filter(product => product !== undefined)
        .map(product => ({
          id: product.id,
          name: product.name,
          price: product.price
        }));
      
      console.log(`🎯 최종 인기 상품 결과: ${result.length}개`);

      // 결과가 없으면 빈 배열 반환
      if (result.length === 0) {
        console.log('ℹ️ 인기 상품 데이터가 없습니다.');
        
        // 빈 배열도 캐시에 저장 (TTL: 5분)
        try {
          await this.redisService.setTopSellersCache([], 300);
          console.log('✅ Redis 캐시에 빈 인기 상품 배열 저장 성공');
        } catch (cacheError) {
          console.warn('⚠️ Redis 캐시 저장 실패:', cacheError.message);
        }
        
        return [];
      }

      // Redis에 캐시 저장 (에러 처리 포함, TTL: 5분)
      try {
        await this.redisService.setTopSellersCache(result, 300);
        console.log('✅ Redis 캐시에 인기 상품 저장 성공');
      } catch (cacheError) {
        console.warn('⚠️ Redis 캐시 저장 실패:', cacheError.message);
        // 캐시 저장 실패해도 결과는 반환
      }
      
      console.log('✅ GetTopSellersUseCase 실행 완료');
      return result;
    } catch (error) {
      console.error('❌ 인기 상품 조회 실패:', error.message);
      console.error('❌ 에러 상세 정보:', {
        name: error.name,
        stack: error.stack,
        message: error.message
      });
      
      // 에러가 발생해도 빈 배열 반환 (400 에러 방지)
      // 빈 배열도 캐시에 저장 (TTL: 5분)
      try {
        await this.redisService.setTopSellersCache([], 300);
        console.log('✅ Redis 캐시에 빈 인기 상품 배열 저장 성공');
      } catch (cacheError) {
        console.warn('⚠️ Redis 캐시 저장 실패:', cacheError.message);
      }
      
      return [];
    }
  }
} 