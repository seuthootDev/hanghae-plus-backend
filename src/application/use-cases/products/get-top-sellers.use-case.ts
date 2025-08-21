import { Injectable, Inject } from '@nestjs/common';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';

@Injectable()
export class GetTopSellersUseCase {
  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  async execute(): Promise<TopSellerResponseDto[]> {
    console.log('🚀 GetTopSellersUseCase 실행 시작');
    
    try {
      // Redis Sorted Set에서 상위 5개 상품 ID 조회 (점수 내림차순)
      console.log('🔍 Redis Sorted Set에서 인기 상품 랭킹 조회');
      const rankingKey = 'product:ranking';
      const allProductIds = await this.redisService.zrange(rankingKey, 0, -1, 'WITHSCORES'); // 모든 상품 ID와 점수 조회
      
      if (!allProductIds || allProductIds.length === 0) {
        console.log('ℹ️ 인기 상품 랭킹 데이터가 없습니다.');
        return [];
      }
      
      // 점수 기준으로 내림차순 정렬하여 상위 5개 선택
      const productRankings = [];
      for (let i = 0; i < allProductIds.length; i += 2) {
        const productId = allProductIds[i];
        const score = parseFloat(allProductIds[i + 1]);
        productRankings.push({ productId, score });
      }
      
      // 점수 내림차순 정렬 후 상위 5개 선택
      const topProductIds = productRankings
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.productId);
      
      console.log(`📊 랭킹 데이터 조회 결과: ${topProductIds.length}개`);
      
      // 상품 정보 조회
      console.log('🔍 상품 정보 조회 시도');
      const products = await this.productsService.getProducts();
      console.log(`📦 상품 데이터 조회 결과: ${products?.length || 0}개`);
      
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // 랭킹 순서대로 상품 정보 매핑
      const result = topProductIds
        .map(productIdStr => {
          const productId = parseInt(productIdStr);
          return productMap.get(productId);
        })
        .filter(product => product !== undefined)
        .map(product => ({
          id: product.id,
          name: product.name,
          price: product.price
        }));
      
      console.log(`🎯 최종 인기 상품 결과: ${result.length}개`);
      console.log('✅ GetTopSellersUseCase 실행 완료');
      
      return result;
      
    } catch (error) {
      console.error('❌ 인기 상품 랭킹 조회 실패:', error.message);
      console.error('❌ 에러 상세 정보:', {
        name: error.name,
        stack: error.stack,
        message: error.message
      });
      
      // 에러가 발생해도 빈 배열 반환 (400 에러 방지)
      return [];
    }
  }
} 