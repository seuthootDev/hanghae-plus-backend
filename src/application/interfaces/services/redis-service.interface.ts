export interface RedisServiceInterface {
  // Redis 분산 락을 위한 메서드들
  set(key: string, value: string, ...args: any[]): Promise<string | null>;
  eval(script: string, numKeys: number, ...args: any[]): Promise<any>;
  pttl(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;

  // 상품별 판매량 관련 메서드들
  incrementProductSales(productId: number, quantity: number): Promise<void>;
  getProductSales(productId: number): Promise<number>;
  getAllProductSales(): Promise<Map<number, number>>;

  // 인기 상품 캐시 관련 메서드들
  setTopSellersCache(topSellers: any[]): Promise<void>;
  getTopSellersCache(): Promise<any[] | null>;

  // Redis 연결 종료
  onModuleDestroy(): Promise<void>;
}

export const REDIS_SERVICE = 'REDIS_SERVICE'; 