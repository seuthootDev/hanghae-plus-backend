export interface RedisServiceInterface {
  // Redis 분산 락을 위한 메서드들
  set(key: string, value: string, ...args: any[]): Promise<string | null>;
  eval(script: string, numKeys: number, ...args: any[]): Promise<any>;
  pttl(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;

  // Redis 원자적 연산을 위한 메서드들
  decr(key: string): Promise<number>;
  incr(key: string): Promise<number>;

  // Redis 기본 메서드들
  get(key: string): Promise<string | null>;

  // Redis Sorted Set 메서드들
  zadd(key: string, score: number, member: string): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  zscore(key: string, member: string): Promise<number | null>;
  zrank(key: string, member: string): Promise<number | null>;
  zrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]>;
  zcard(key: string): Promise<number>;

  // 상품별 판매량 관련 메서드들
  incrementProductSales(productId: number, quantity: number): Promise<void>;
  getProductSales(productId: number): Promise<number>;
  getAllProductSales(): Promise<Map<number, number>>;

  // 인기 상품 캐시 관련 메서드들
  setTopSellersCache(topSellers: any[], ttl?: number): Promise<void>;
  getTopSellersCache(): Promise<any[] | null>;

  // 상품 관련 캐시 메서드들
  setProductCache(productId: number, product: any, ttl?: number): Promise<void>;
  getProductCache(productId: number): Promise<any | null>;
  setProductsCache(products: any[], ttl?: number): Promise<void>;
  getProductsCache(): Promise<any[] | null>;
  setProductsByCategoryCache(category: string, products: any[], ttl?: number): Promise<void>;
  getProductsByCategoryCache(category: string): Promise<any[] | null>;

  // 사용자 관련 캐시 메서드들
  setUserPointsCache(userId: number, points: number, ttl?: number): Promise<void>;
  getUserPointsCache(userId: number): Promise<number | null>;

  // 캐시 무효화 메서드들
  invalidateProductCache(productId: number): Promise<void>;
  invalidateProductsCache(): Promise<void>;
  invalidateTopSellersCache(): Promise<void>;
  invalidateUserPointsCache(userId: number): Promise<void>;

  // TTL 설정 메서드
  setWithTTL(key: string, value: any, ttl: number): Promise<void>;
  expire(key: string, seconds: number): Promise<boolean>;

  // Redis 연결 종료
  onModuleDestroy(): Promise<void>;
}

export const REDIS_SERVICE = 'REDIS_SERVICE'; 