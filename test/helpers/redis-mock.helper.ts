import { RedisServiceInterface } from '../../src/application/interfaces/services/redis-service.interface';

export function createMockRedisService(): jest.Mocked<RedisServiceInterface> {
  return {
    // 기본 Redis 메서드들
    set: jest.fn(),
    eval: jest.fn(),
    pttl: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    decr: jest.fn(),
    incr: jest.fn(),
    
    // 기존 캐시 메서드들
    getTopSellersCache: jest.fn(),
    setTopSellersCache: jest.fn(),
    incrementProductSales: jest.fn(),
    getProductSales: jest.fn(),
    getAllProductSales: jest.fn(),
    
    // 새로 추가된 캐시 메서드들
    setProductCache: jest.fn(),
    getProductCache: jest.fn(),
    setProductsCache: jest.fn(),
    getProductsCache: jest.fn(),
    setProductsByCategoryCache: jest.fn(),
    getProductsByCategoryCache: jest.fn(),
    setUserPointsCache: jest.fn(),
    getUserPointsCache: jest.fn(),
    
    // 캐시 무효화 메서드들
    invalidateProductCache: jest.fn(),
    invalidateProductsCache: jest.fn(),
    invalidateTopSellersCache: jest.fn(),
    invalidateUserPointsCache: jest.fn(),
    
    // 유틸리티 메서드들
    setWithTTL: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

