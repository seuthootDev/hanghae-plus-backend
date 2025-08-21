import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  // 매일 자정에 3일 전 데이터 정리 (슬라이딩 윈도우)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldRankings() {
    try {
      
      // 3일 전 날짜 계산
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const oldDateKey = threeDaysAgo.toISOString().split('T')[0];
      const oldRankingKey = `product:ranking:${oldDateKey}`;
      
      // 3일 전 데이터 삭제
      const deletedCount = await this.redisService.del(oldRankingKey);
      
      // 전체 랭킹 재계산 (2일치 + 오늘 데이터 합산)
      await this.recalculateOverallRanking();
      
    } catch (error) {
      console.error('❌ 자정 랭킹 정리 실패:', error.message);
    }
  }

  // 전체 랭킹 재계산 (2일치 + 오늘 데이터 합산)
  private async recalculateOverallRanking(): Promise<void> {
    try {
      const overallRankingKey = 'product:ranking:3d';
      
      // 최근 3일간의 날짜 키들 생성
      const dateKeys = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dateKeys.push(`product:ranking:${dateKey}`);
      }
      
      // 각 날짜별 데이터를 전체 랭킹에 합산
      for (const dateKey of dateKeys) {
        const dailyRankings = await this.redisService.zrange(dateKey, 0, -1, 'WITHSCORES');
        
        for (let i = 0; i < dailyRankings.length; i += 2) {
          const productId = dailyRankings[i];
          const dailyScore = parseFloat(dailyRankings[i + 1]);
          
          // 전체 랭킹에 누적
          const currentScore = await this.redisService.zscore(overallRankingKey, productId);
          const newScore = (currentScore || 0) + dailyScore;
          await this.redisService.zadd(overallRankingKey, newScore, productId);
        }
      }
      
      // 전체 랭킹에 3일 TTL 설정
      await this.redisService.expire(overallRankingKey, 3 * 24 * 60 * 60);
      
    } catch (error) {
      console.error('❌ 전체 랭킹 재계산 실패:', error.message);
    }
  }

  async execute(): Promise<TopSellerResponseDto[]> {
    
    try {
      // Redis Sorted Set에서 상위 5개 상품 ID 조회 (점수 내림차순)
      const rankingKey = 'product:ranking:3d'; // 3일 슬라이딩 윈도우 (전체 합산)
      const allProductIds = await this.redisService.zrange(rankingKey, 0, -1, 'WITHSCORES'); // 모든 상품 ID와 점수 조회
      
      if (!allProductIds || allProductIds.length === 0) {
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
      
      
      // 상품 정보 조회
      const products = await this.productsService.getProducts();
      
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