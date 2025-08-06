import { Injectable, Inject } from '@nestjs/common';
import { RedisServiceInterface, REDIS_SERVICE } from '../../application/interfaces/services/redis-service.interface';
import { RedisDistributedLockServiceInterface, LockOptions } from '../../application/interfaces/services/redis-distributed-lock-service.interface';

@Injectable()
export class RedisDistributedLockService implements RedisDistributedLockServiceInterface {
  constructor(
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  /**
   * Redis를 사용한 분산 락 획득
   * @param key 락 키
   * @param options 락 옵션
   * @returns 락 획득 성공 여부
   */
  async acquireLock(key: string, options: LockOptions = {}): Promise<boolean> {
    const { ttl = 5000, retryCount = 3, retryDelay = 100 } = options;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        // Redis SET 명령어로 락 획득 시도
        // NX: 키가 없을 때만 설정, PX: 밀리초 단위 TTL
        const result = await this.redisService.set(key, 'locked', 'PX', ttl, 'NX');
        
        if (result === 'OK') {
          return true; // 락 획득 성공
        }
        
        // 락 획득 실패 시 대기
        if (i < retryCount - 1) {
          await this.sleep(retryDelay);
        }
      } catch (error) {
        console.error(`Redis 락 획득 실패 (시도 ${i + 1}/${retryCount}):`, error);
        
        if (i === retryCount - 1) {
          throw new Error(`Redis 락 획득 실패: ${error.message}`);
        }
      }
    }
    
    return false; // 모든 재시도 실패
  }

  /**
   * Redis 락 해제
   * @param key 락 키
   * @returns 해제 성공 여부
   */
  async releaseLock(key: string): Promise<boolean> {
    try {
      // Lua 스크립트로 안전한 락 해제
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redisService.eval(luaScript, 1, key, 'locked');
      return result === 1;
    } catch (error) {
      console.error('Redis 락 해제 실패:', error);
      return false;
    }
  }

  /**
   * 락 키의 TTL 확인
   * @param key 락 키
   * @returns TTL (밀리초), -1은 키가 없음, -2는 키가 있지만 TTL 없음
   */
  async getLockTTL(key: string): Promise<number> {
    try {
      return await this.redisService.pttl(key);
    } catch (error) {
      console.error('Redis TTL 조회 실패:', error);
      return -1;
    }
  }

  /**
   * 락이 존재하는지 확인
   * @param key 락 키
   * @returns 락 존재 여부
   */
  async isLocked(key: string): Promise<boolean> {
    try {
      const exists = await this.redisService.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis 락 존재 확인 실패:', error);
      return false;
    }
  }

  /**
   * 모든 락 키 조회 (디버깅용)
   * @param pattern 패턴 (예: "lock:*")
   * @returns 락 키 목록
   */
  async getLockKeys(pattern: string = 'lock:*'): Promise<string[]> {
    try {
      return await this.redisService.keys(pattern);
    } catch (error) {
      console.error('Redis 락 키 조회 실패:', error);
      return [];
    }
  }

  /**
   * 모든 락 해제 (주의: 개발/테스트용)
   * @param pattern 패턴
   * @returns 해제된 락 개수
   */
  async clearAllLocks(pattern: string = 'lock:*'): Promise<number> {
    try {
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        return await this.redisService.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Redis 모든 락 해제 실패:', error);
      return 0;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 