import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    // 테스트 환경에서는 Redis 연결을 시도하지 않음
    if (process.env.NODE_ENV === 'test') {
      this.redis = null;
      return;
    }
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // 상품별 판매량 증가
  async incrementProductSales(productId: number, quantity: number): Promise<void> {
    if (!this.redis) return; // 테스트 환경에서는 무시
    
    const key = `product:sales:${productId}`;
    await this.redis.incrby(key, quantity);
    
    // 3일 후 만료 (최근 3일간 집계)
    await this.redis.expire(key, 3 * 24 * 60 * 60);
  }

  // 상품별 판매량 조회
  async getProductSales(productId: number): Promise<number> {
    if (!this.redis) return 0; // 테스트 환경에서는 0 반환
    
    const key = `product:sales:${productId}`;
    const sales = await this.redis.get(key);
    return sales ? parseInt(sales) : 0;
  }

  // 모든 상품의 판매량 조회
  async getAllProductSales(): Promise<Map<number, number>> {
    if (!this.redis) return new Map(); // 테스트 환경에서는 빈 Map 반환
    
    const pattern = 'product:sales:*';
    const keys = await this.redis.keys(pattern);
    const salesMap = new Map<number, number>();

    for (const key of keys) {
      const productId = parseInt(key.split(':')[2]);
      const sales = await this.redis.get(key);
      if (sales) {
        salesMap.set(productId, parseInt(sales));
      }
    }

    return salesMap;
  }

  // 인기 상품 키 설정 (캐시)
  async setTopSellersCache(topSellers: any[]): Promise<void> {
    if (!this.redis) return; // 테스트 환경에서는 무시
    
    const key = 'top_sellers_cache';
    await this.redis.setex(key, 300, JSON.stringify(topSellers)); // 5분 캐시
  }

  // 인기 상품 캐시 조회
  async getTopSellersCache(): Promise<any[] | null> {
    if (!this.redis) return null; // 테스트 환경에서는 null 반환
    
    const key = 'top_sellers_cache';
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Redis 연결 종료
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
} 