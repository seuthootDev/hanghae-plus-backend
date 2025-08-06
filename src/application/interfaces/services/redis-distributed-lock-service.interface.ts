export interface LockOptions {
  ttl?: number; // TTL in milliseconds
  retryCount?: number;
  retryDelay?: number;
}

export interface RedisDistributedLockServiceInterface {
  /**
   * Redis를 사용한 분산 락 획득
   * @param key 락 키
   * @param options 락 옵션
   * @returns 락 획득 성공 여부
   */
  acquireLock(key: string, options?: LockOptions): Promise<boolean>;

  /**
   * Redis 락 해제
   * @param key 락 키
   * @returns 해제 성공 여부
   */
  releaseLock(key: string): Promise<boolean>;

  /**
   * 락 키의 TTL 확인
   * @param key 락 키
   * @returns TTL (밀리초), -1은 키가 없음, -2는 키가 있지만 TTL 없음
   */
  getLockTTL(key: string): Promise<number>;

  /**
   * 락이 존재하는지 확인
   * @param key 락 키
   * @returns 락 존재 여부
   */
  isLocked(key: string): Promise<boolean>;

  /**
   * 모든 락 키 조회 (디버깅용)
   * @param pattern 패턴 (예: "lock:*")
   * @returns 락 키 목록
   */
  getLockKeys(pattern?: string): Promise<string[]>;

  /**
   * 모든 락 해제 (주의: 개발/테스트용)
   * @param pattern 패턴
   * @returns 해제된 락 개수
   */
  clearAllLocks(pattern?: string): Promise<number>;
}

export const REDIS_DISTRIBUTED_LOCK_SERVICE = 'REDIS_DISTRIBUTED_LOCK_SERVICE'; 