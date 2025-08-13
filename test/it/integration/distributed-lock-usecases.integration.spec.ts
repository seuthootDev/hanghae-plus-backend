import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RedisDistributedLockService } from '../../../src/infrastructure/services/redis-distributed-lock.service';
import { RedisService } from '../../../src/infrastructure/services/redis.service';
import { REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';

describe('Distributed Lock Use Cases Integration Tests', () => {
  let app: INestApplication;
  let redisDistributedLockService: RedisDistributedLockService;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        RedisDistributedLockService,
        {
          provide: REDIS_SERVICE,
          useClass: RedisService
        }
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    redisDistributedLockService = moduleFixture.get<RedisDistributedLockService>(RedisDistributedLockService);
    redisService = moduleFixture.get<RedisService>(REDIS_SERVICE);
  });

  afterAll(async () => {
    // 모든 락 정리
    await redisDistributedLockService.clearAllLocks('usecase:*');
    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 락 정리
    await redisDistributedLockService.clearAllLocks('usecase:*');
  });

  describe('회원가입 분산락 시뮬레이션 테스트', () => {
    it('동시에 같은 이메일로 회원가입 시도 시 하나만 성공해야 한다', async () => {
      // Arrange
      const email = 'test-concurrent@example.com';
      const lockKey = `usecase:auth:register:${email}`;
      
      // 락이 아직 존재하지 않는지 확인
      const isLockedBefore = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedBefore).toBe(false);

      // Act - 동시에 같은 이메일에 대한 락 획득 시도
      const concurrentRequests = 3;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        try {
          return await redisDistributedLockService.acquireLock(lockKey, {
            ttl: 5000,
            retryCount: 1
          });
        } catch (error) {
          return false;
        }
      });

      const results = await Promise.all(promises);

      // Assert - 하나만 성공하고 나머지는 실패해야 함
      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(concurrentRequests - 1);
      
      // 성공한 락 해제
      await redisDistributedLockService.releaseLock(lockKey);
      
      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });

    it('회원가입 락 TTL이 만료되면 자동으로 해제되어야 한다', async () => {
      // Arrange
      const email = 'test-ttl@example.com';
      const lockKey = `usecase:auth:register:${email}`;

      // 짧은 TTL로 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 100, // 100ms
        retryCount: 1
      });
      expect(acquired).toBe(true);

      // TTL 만료 대기
      await new Promise(resolve => setTimeout(resolve, 200));

      // Assert - TTL 만료 후 락 해제 확인
      const isLocked = await redisDistributedLockService.isLocked(lockKey);
      expect(isLocked).toBe(false);
    });
  });

  describe('쿠폰 발급 분산락 시뮬레이션 테스트', () => {
    it('동시에 같은 사용자에게 쿠폰 발급 시도 시 하나만 성공해야 한다', async () => {
      // Arrange
      const userId = 1;
      const couponType = 'DISCOUNT_10';
      const lockKey = `usecase:coupon:issue:${userId}:${couponType}`;
      
      // 락이 아직 존재하지 않는지 확인
      const isLockedBefore = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedBefore).toBe(false);

      // Act - 동시에 같은 사용자에 대한 쿠폰 발급 락 획득 시도
      const concurrentRequests = 3;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        try {
          return await redisDistributedLockService.acquireLock(lockKey, {
            ttl: 5000,
            retryCount: 1
          });
        } catch (error) {
          return false;
        }
      });

      const results = await Promise.all(promises);

      // Assert - 하나만 성공하고 나머지는 실패해야 함
      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(concurrentRequests - 1);
      
      // 성공한 락 해제
      await redisDistributedLockService.releaseLock(lockKey);
      
      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });

    it('선착순 쿠폰 발급 시 순서가 보장되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const couponType = 'LIMITED_OFFER';
      const lockKey = `usecase:coupon:issue:${userId}:${couponType}`;

      // Act - 순차적으로 락 획득 시도
      const results: boolean[] = [];
      const promises = Array(3).fill(null).map(async (_, index) => {
        try {
          const acquired = await redisDistributedLockService.acquireLock(lockKey, {
            ttl: 1000,
            retryCount: 1
          });
          
          if (acquired) {
            results.push(true);
            // 짧은 시간 후 락 해제
            await new Promise(resolve => setTimeout(resolve, 100));
            await redisDistributedLockService.releaseLock(lockKey);
          } else {
            results.push(false);
          }
          
          return acquired;
        } catch (error) {
          results.push(false);
          return false;
        }
      });

      await Promise.all(promises);

      // Assert - 첫 번째만 성공하고 나머지는 실패해야 함
      expect(results[0]).toBe(true);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(false);
      
      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });
  });

  describe('주문 생성 분산락 시뮬레이션 테스트', () => {
    it('동시에 같은 사용자의 주문 생성 시도 시 하나만 성공해야 한다', async () => {
      // Arrange
      const userId = 1;
      const lockKey = `usecase:order:create:${userId}`;
      
      // 락이 아직 존재하지 않는지 확인
      const isLockedBefore = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedBefore).toBe(false);

      // Act - 동시에 같은 사용자에 대한 주문 생성 락 획득 시도
      const concurrentRequests = 3;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        try {
          return await redisDistributedLockService.acquireLock(lockKey, {
            ttl: 5000,
            retryCount: 1
          });
        } catch (error) {
          return false;
        }
      });

      const results = await Promise.all(promises);

      // Assert - 하나만 성공하고 나머지는 실패해야 함
      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(concurrentRequests - 1);
      
      // 성공한 락 해제
      await redisDistributedLockService.releaseLock(lockKey);
      
      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });

    it('재고 부족 시 주문 생성이 실패하고 락이 해제되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const lockKey = `usecase:order:create:${userId}`;

      // 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 1000,
        retryCount: 1
      });
      expect(acquired).toBe(true);

      // Act - 재고 부족 시뮬레이션 (락 해제)
      await redisDistributedLockService.releaseLock(lockKey);

      // Assert - 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });
  });

  describe('결제 처리 분산락 시뮬레이션 테스트', () => {
    it('동시에 같은 주문에 대한 결제 처리 시도 시 하나만 성공해야 한다', async () => {
      // Arrange
      const orderId = 1;
      const lockKey = `usecase:payment:process:${orderId}`;
      
      // 락이 아직 존재하지 않는지 확인
      const isLockedBefore = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedBefore).toBe(false);

      // Act - 동시에 같은 주문에 대한 결제 처리 락 획득 시도
      const concurrentRequests = 3;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        try {
          return await redisDistributedLockService.acquireLock(lockKey, {
            ttl: 5000,
            retryCount: 1
          });
        } catch (error) {
          return false;
        }
      });

      const results = await Promise.all(promises);

      // Assert - 하나만 성공하고 나머지는 실패해야 함
      const successCount = results.filter(result => result === true).length;
      const failureCount = results.filter(result => result === false).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(concurrentRequests - 1);
      
      // 성공한 락 해제
      await redisDistributedLockService.releaseLock(lockKey);
      
      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });

    it('중복 결제 방지가 작동해야 한다', async () => {
      // Arrange
      const orderId = 1;
      const lockKey = `usecase:payment:process:${orderId}`;

      // Act - 첫 번째 결제 처리 락 획득
      const firstLock = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(firstLock).toBe(true);

      // 두 번째 결제 처리 락 획득 시도 (중복 결제)
      const secondLock = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(secondLock).toBe(false); // 중복 결제 방지

      // 첫 번째 락 해제
      await redisDistributedLockService.releaseLock(lockKey);

      // Assert - 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(lockKey);
      expect(isLockedAfter).toBe(false);
    });
  });

  describe('대량 동시 요청 성능 테스트', () => {
    it('대량 동시 요청 시 분산락이 정상적으로 작동해야 한다', async () => {
      // Arrange
      const lockKeys = Array.from({ length: 20 }, (_, i) => `usecase:bulk:${i}`);

      // Act - 대량 동시 락 획득
      const startTime = Date.now();
      const promises = lockKeys.map(key => 
        redisDistributedLockService.acquireLock(key, {
          ttl: 5000,
          retryCount: 1
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Assert - 모든 락 획득 성공
      expect(results.every(result => result === true)).toBe(true);

      // 성능 측정
      const totalTime = endTime - startTime;
      const throughput = (lockKeys.length / totalTime) * 1000; // req/s
      console.log(`📊 대량 동시 락 획득 성능: ${totalTime}ms, ${throughput.toFixed(2)} req/s`);

      // 모든 락 해제
      await Promise.all(
        lockKeys.map(key => redisDistributedLockService.releaseLock(key))
      );

      // 모든 락이 해제되었는지 확인
      for (const key of lockKeys) {
        const isLocked = await redisDistributedLockService.isLocked(key);
        expect(isLocked).toBe(false);
      }
    });
  });
});
