import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisServiceInterface } from '../../application/interfaces/services/redis-service.interface';

@Injectable()
export class RedisService implements RedisServiceInterface {
  private readonly redis: Redis;
  private readonly testLocks = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    // 테스트 환경에서는 Redis 연결을 시도하지 않음
    if (process.env.NODE_ENV === 'test' || !process.env.REDIS_HOST) {
      this.redis = null;
      return;
    }
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    
  }

  // Redis 분산 락을 위한 메서드들
  async set(key: string, value: string, ...args: any[]): Promise<string | null> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 락 사용
      const ttlIndex = args.indexOf('PX');
      const ttl = ttlIndex !== -1 ? args[ttlIndex + 1] : 5000;
      const nxIndex = args.indexOf('NX');
      
      if (nxIndex !== -1 && this.testLocks.has(key)) {
        return null; // 락이 이미 존재하면 실패
      }
      
      this.testLocks.set(key, {
        value,
        expiresAt: Date.now() + ttl
      });
      return 'OK';
    }
    return await this.redis.set(key, value, ...args);
  }

  async eval(script: string, numKeys: number, ...args: any[]): Promise<any> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 락 해제
      const key = args[0];
      const expectedValue = args[1];
      const lock = this.testLocks.get(key);
      
      if (lock && lock.value === expectedValue) {
        this.testLocks.delete(key);
        return 1;
      }
      return 0;
    }
    return await this.redis.eval(script, numKeys, ...args);
  }

  async pttl(key: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 TTL 계산
      const lock = this.testLocks.get(key);
      if (!lock) return -1;
      
      const remaining = lock.expiresAt - Date.now();
      return Math.max(0, remaining);
    }
    return await this.redis.pttl(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 존재 확인
      const lock = this.testLocks.get(key);
      if (!lock) return 0;
      
      // 만료된 락은 자동 삭제
      if (Date.now() > lock.expiresAt) {
        this.testLocks.delete(key);
        return 0;
      }
      
      return 1;
    }
    return await this.redis.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 키 조회
      const keys: string[] = [];
      const regex = new RegExp(pattern.replace('*', '.*'));
      
      for (const [key, lock] of this.testLocks.entries()) {
        if (regex.test(key) && Date.now() <= lock.expiresAt) {
          keys.push(key);
        }
      }
      
      return keys;
    }
    return await this.redis.keys(pattern);
  }

  // Redis 원자적 연산을 위한 메서드들
  async decr(key: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 감소 연산
      const currentValue = parseInt(this.testLocks.get(key)?.value || '0');
      const newValue = currentValue - 1;
      this.testLocks.set(key, {
        value: newValue.toString(),
        expiresAt: Date.now() + 30000 // 30초 TTL
      });
      return newValue;
    }
    return await this.redis.decr(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 증가 연산
      const currentValue = parseInt(this.testLocks.get(key)?.value || '0');
      const newValue = currentValue + 1;
      this.testLocks.set(key, {
        value: newValue.toString(),
        expiresAt: Date.now() + 30000 // 30초 TTL
      });
      return newValue;
    }
    return await this.redis.incr(key);
  }

  // Redis 기본 메서드들
  async get(key: string): Promise<string | null> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 조회
      const lock = this.testLocks.get(key);
      if (!lock || Date.now() > lock.expiresAt) {
        return null;
      }
      return lock.value;
    }
    return await this.redis.get(key);
  }

  // Redis Sorted Set 메서드들
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      if (!this.testLocks.has(key)) {
        this.testLocks.set(key, {
          value: JSON.stringify([[member, score]]),
          expiresAt: Date.now() + 30000
        });
        return 1;
      }
      
      const lock = this.testLocks.get(key);
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      sortedSet.set(member, score);
      lock.value = JSON.stringify(Array.from(sortedSet.entries()));
      return 1;
    }
    return await this.redis.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      const lock = this.testLocks.get(key);
      if (!lock) return 0;
      
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      const removed = sortedSet.delete(member);
      lock.value = JSON.stringify(Array.from(sortedSet.entries()));
      return removed ? 1 : 0;
    }
    return await this.redis.zrem(key, member);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      const lock = this.testLocks.get(key);
      if (!lock) return null;
      
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      return sortedSet.get(member) || null;
    }
    const result = await this.redis.zscore(key, member);
    return result ? parseFloat(result) : null;
  }

  async zrank(key: string, member: string): Promise<number | null> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      const lock = this.testLocks.get(key);
      if (!lock) return null;
      
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      if (!sortedSet.has(member)) return null;
      
      const sortedEntries = Array.from(sortedSet.entries()).sort((a, b) => a[1] - b[1]);
      const index = sortedEntries.findIndex(([m]) => m === member);
      return index >= 0 ? index : null;
    }
    return await this.redis.zrank(key, member);
  }

  async zrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      const lock = this.testLocks.get(key);
      if (!lock) {
        return [];
      }
      
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      const sortedEntries = Array.from(sortedSet.entries()).sort((a, b) => a[1] - b[1]);
      
      // Redis zrange와 동일하게 처리: stop이 -1이면 끝까지
      const actualStop = stop === -1 ? sortedEntries.length - 1 : stop;
      const sliced = sortedEntries.slice(start, actualStop + 1);
      
      if (withScores === 'WITHSCORES') {
        const result: string[] = [];
        for (const [member, score] of sliced) {
          result.push(member, score.toString());
        }
        return result;
      }
      
      const result = sliced.map(([member]) => member);
      return result;
    }
    return await this.redis.zrange(key, start, stop, withScores as any);
  }

  async zcard(key: string): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 Sorted Set 구현
      const lock = this.testLocks.get(key);
      if (!lock) return 0;
      
      const entries = JSON.parse(lock.value as string) as [string, number][];
      const sortedSet = new Map<string, number>(entries);
      return sortedSet.size;
    }
    return await this.redis.zcard(key);
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.redis) {
      // 테스트 환경에서는 메모리 기반 삭제
      let deletedCount = 0;
      for (const key of keys) {
        if (this.testLocks.delete(key)) {
          deletedCount++;
        }
      }
      return deletedCount;
    }
    return await this.redis.del(...keys);
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
  async setTopSellersCache(topSellers: any[], ttl: number = 300): Promise<void> {
    if (!this.redis) return; // 테스트 환경에서는 무시
    
    const key = 'top_sellers_cache';
    await this.redis.setex(key, ttl, JSON.stringify(topSellers));
  }

  // 인기 상품 캐시 조회
  async getTopSellersCache(): Promise<any[] | null> {
    if (!this.redis) return null; // 테스트 환경에서는 null 반환
    
    const key = 'top_sellers_cache';
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 상품 개별 캐시 설정
  async setProductCache(productId: number, product: any, ttl: number = 600): Promise<void> {
    if (!this.redis) return;
    
    const key = `product:${productId}`;
    await this.redis.setex(key, ttl, JSON.stringify(product));
  }

  // 상품 개별 캐시 조회
  async getProductCache(productId: number): Promise<any | null> {
    if (!this.redis) return null;
    
    const key = `product:${productId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 상품 목록 캐시 설정
  async setProductsCache(products: any[], ttl: number = 600): Promise<void> {
    if (!this.redis) return;
    
    const key = 'products:all';
    await this.redis.setex(key, ttl, JSON.stringify(products));
  }

  // 상품 목록 캐시 조회
  async getProductsCache(): Promise<any[] | null> {
    if (!this.redis) return null;
    
    const key = 'products:all';
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 카테고리별 상품 캐시 설정
  async setProductsByCategoryCache(category: string, products: any[], ttl: number = 600): Promise<void> {
    if (!this.redis) return;
    
    const key = `products:category:${category}`;
    await this.redis.setex(key, ttl, JSON.stringify(products));
  }

  // 카테고리별 상품 캐시 조회
  async getProductsByCategoryCache(category: string): Promise<any[] | null> {
    if (!this.redis) return null;
    
    const key = `products:category:${category}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 사용자 포인트 캐시 설정
  async setUserPointsCache(userId: number, points: number, ttl: number = 300): Promise<void> {
    if (!this.redis) return;
    
    const key = `user:points:${userId}`;
    await this.redis.setex(key, ttl, points.toString());
  }

  // 사용자 포인트 캐시 조회
  async getUserPointsCache(userId: number): Promise<number | null> {
    if (!this.redis) return null;
    
    const key = `user:points:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? parseInt(cached) : null;
  }

  // 상품 개별 캐시 무효화
  async invalidateProductCache(productId: number): Promise<void> {
    if (!this.redis) return;
    
    const key = `product:${productId}`;
    await this.redis.del(key);
  }

  // 상품 목록 캐시 무효화
  async invalidateProductsCache(): Promise<void> {
    if (!this.redis) return;
    
    const keys = [
      'products:all',
      'top_sellers_cache'
    ];
    
    // 카테고리별 캐시도 함께 무효화
    const categoryKeys = await this.redis.keys('products:category:*');
    keys.push(...categoryKeys);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // 인기 상품 캐시 무효화
  async invalidateTopSellersCache(): Promise<void> {
    if (!this.redis) return;
    
    const key = 'top_sellers_cache';
    await this.redis.del(key);
  }

  // 사용자 포인트 캐시 무효화
  async invalidateUserPointsCache(userId: number): Promise<void> {
    if (!this.redis) return;
    
    const key = `user:points:${userId}`;
    await this.redis.del(key);
  }

  // TTL 설정 메서드
  async setWithTTL(key: string, value: any, ttl: number): Promise<void> {
    if (!this.redis) return;
    
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  // Redis 연결 종료
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
} 