import { Test, TestingModule } from '@nestjs/testing';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../../src/application/interfaces/services/redis-distributed-lock-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { TestAppModule } from '../../app.module';

describe('Redis Distributed Lock Integration Tests', () => {
  let module: TestingModule;
  let redisDistributedLockService: RedisDistributedLockServiceInterface;
  let redisService: RedisServiceInterface;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    redisDistributedLockService = module.get<RedisDistributedLockServiceInterface>(REDIS_DISTRIBUTED_LOCK_SERVICE);
    redisService = module.get<RedisServiceInterface>(REDIS_SERVICE);
  });

  afterAll(async () => {
    // 테스트 후 모든 락 정리
    await redisDistributedLockService.clearAllLocks('test:*');
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 테스트 락들 정리
    await redisDistributedLockService.clearAllLocks('test:*');
  });

  describe('Redis 분산 락 기본 기능 테스트', () => {
    it('락을 획득하고 해제할 수 있어야 한다', async () => {
      // Arrange
      const lockKey = 'test:basic:lock';

      // Act - 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });

      // Assert - 락 획득 성공
      expect(acquired).toBe(true);

      // Act - 락 존재 확인
      const isLocked = await redisDistributedLockService.isLocked(lockKey);
      expect(isLocked).toBe(true);

      // Act - 락 해제
      const released = await redisDistributedLockService.releaseLock(lockKey);
      expect(released).toBe(true);

      // Assert - 락 해제 확인
      const isLockedAfterRelease = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfterRelease).toBe(false);
    });

    it('이미 획득된 락은 다시 획득할 수 없어야 한다', async () => {
      // Arrange
      const lockKey = 'test:duplicate:lock';

      // Act - 첫 번째 락 획득
      const firstAcquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(firstAcquired).toBe(true);

      // Act - 두 번째 락 획득 시도
      const secondAcquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(secondAcquired).toBe(false);

      // Cleanup
      await redisDistributedLockService.releaseLock(lockKey);
    });

    it('TTL이 만료되면 락이 자동으로 해제되어야 한다', async () => {
      // Arrange
      const lockKey = 'test:ttl:lock';

      // Act - 짧은 TTL로 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 100, // 100ms
        retryCount: 1
      });
      expect(acquired).toBe(true);

      // Act - TTL 만료 대기
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert - TTL 만료 후 락 해제 확인
      const isLocked = await redisDistributedLockService.isLocked(lockKey);
      expect(isLocked).toBe(false);
    });

    it('재시도 로직이 작동해야 한다', async () => {
      // Arrange
      const lockKey = 'test:retry:lock';

      // Act - 첫 번째 락 획득
      const firstAcquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 1000,
        retryCount: 1
      });
      expect(firstAcquired).toBe(true);

      // Act - 짧은 시간 후 락 해제
      setTimeout(async () => {
        await redisDistributedLockService.releaseLock(lockKey);
      }, 100);

      // Act - 재시도 로직으로 락 획득 시도
      const secondAcquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 1000,
        retryCount: 3,
        retryDelay: 50
      });

      // Assert - 재시도 후 락 획득 성공
      expect(secondAcquired).toBe(true);

      // Cleanup
      await redisDistributedLockService.releaseLock(lockKey);
    });
  });

  describe('Redis 분산 락 동시성 테스트', () => {
    it('동시에 여러 락을 획득할 수 있어야 한다', async () => {
      // Arrange
      const lockKeys = [
        'test:concurrent:lock1',
        'test:concurrent:lock2',
        'test:concurrent:lock3'
      ];

      // Act - 동시에 여러 락 획득
      const promises = lockKeys.map(key => 
        redisDistributedLockService.acquireLock(key, {
          ttl: 5000,
          retryCount: 1
        })
      );

      const results = await Promise.all(promises);

      // Assert - 모든 락 획득 성공
      expect(results.every(result => result === true)).toBe(true);

      // Act - 모든 락이 존재하는지 확인
      const lockChecks = await Promise.all(
        lockKeys.map(key => redisDistributedLockService.isLocked(key))
      );
      expect(lockChecks.every(locked => locked === true)).toBe(true);

      // Cleanup
      await Promise.all(
        lockKeys.map(key => redisDistributedLockService.releaseLock(key))
      );
    });

    it('동시 요청 시 순서가 보장되어야 한다', async () => {
      // Arrange
      const lockKey = 'test:order:lock';
      const results: number[] = [];

      // Act - 순차적으로 락 획득 시도
      const promises = Array(5).fill(null).map(async (_, index) => {
        const acquired = await redisDistributedLockService.acquireLock(lockKey, {
          ttl: 1000,
          retryCount: 1
        });
        
        if (acquired) {
          results.push(index);
          await new Promise(resolve => setTimeout(resolve, 100));
          await redisDistributedLockService.releaseLock(lockKey);
        }
        
        return acquired;
      });

      await Promise.all(promises);

      // Assert - 순서대로 처리되었는지 확인
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual([...results].sort((a, b) => a - b));
    });
  });

  describe('Redis 분산 락 유틸리티 테스트', () => {
    it('TTL을 조회할 수 있어야 한다', async () => {
      // Arrange
      const lockKey = 'test:ttl:check';

      // Act - 락 획득
      await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000
      });

      // Act - TTL 조회
      const ttl = await redisDistributedLockService.getLockTTL(lockKey);

      // Assert - TTL이 양수여야 함
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(5000);

      // Cleanup
      await redisDistributedLockService.releaseLock(lockKey);
    });

    it('모든 락 키를 조회할 수 있어야 한다', async () => {
      // Arrange
      const testKeys = [
        'test:keys:lock1',
        'test:keys:lock2',
        'test:keys:lock3'
      ];

      // Act - 여러 락 획득
      await Promise.all(
        testKeys.map(key => 
          redisDistributedLockService.acquireLock(key, { ttl: 5000 })
        )
      );

      // Act - 락 키 조회
      const keys = await redisDistributedLockService.getLockKeys('test:keys:*');

      // Assert - 모든 락 키가 조회됨
      expect(keys.length).toBeGreaterThanOrEqual(testKeys.length);
      testKeys.forEach(key => {
        expect(keys).toContain(key);
      });

      // Cleanup
      await Promise.all(
        testKeys.map(key => redisDistributedLockService.releaseLock(key))
      );
    });

    it('모든 락을 한 번에 해제할 수 있어야 한다', async () => {
      // Arrange
      const testKeys = [
        'test:clear:lock1',
        'test:clear:lock2',
        'test:clear:lock3'
      ];

      // Act - 여러 락 획득
      await Promise.all(
        testKeys.map(key => 
          redisDistributedLockService.acquireLock(key, { ttl: 5000 })
        )
      );

      // Act - 모든 락 해제
      const clearedCount = await redisDistributedLockService.clearAllLocks('test:clear:*');

      // Assert - 모든 락이 해제됨
      expect(clearedCount).toBe(testKeys.length);

      // Assert - 락이 더 이상 존재하지 않음
      const remainingKeys = await redisDistributedLockService.getLockKeys('test:clear:*');
      expect(remainingKeys.length).toBe(0);
    });
  });
}); 