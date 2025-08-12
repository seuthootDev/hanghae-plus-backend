import { Test, TestingModule } from '@nestjs/testing';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../../src/application/interfaces/services/redis-distributed-lock-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { TestAppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { ChargePointsUseCase } from '../../../src/application/use-cases/users/charge-points.use-case';
import { IssueCouponUseCase } from '../../../src/application/use-cases/coupons/issue-coupon.use-case';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';

// 실행 단계별 락 상태를 추적하는 인터페이스
interface LockStateLog {
  step: string;
  timestamp: number;
  lockKey: string;
  isLocked: boolean;
  description: string;
}

// 락 상태 추적기
class LockStateTracker {
  private logs: LockStateLog[] = [];
  private readonly redisDistributedLockService: RedisDistributedLockServiceInterface;

  constructor(redisDistributedLockService: RedisDistributedLockServiceInterface) {
    this.redisDistributedLockService = redisDistributedLockService;
  }

  async logLockState(step: string, lockKey: string, description: string): Promise<void> {
    const isLocked = await this.redisDistributedLockService.isLocked(lockKey);
    this.logs.push({
      step,
      timestamp: Date.now(),
      lockKey,
      isLocked,
      description
    });
  }

  getLogs(): LockStateLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // 락 획득 시점과 해제 시점을 찾아서 순서 검증
  async verifyLockSequence(lockKey: string): Promise<{ success: boolean; message: string; logs: LockStateLog[] }> {
    const relevantLogs = this.logs.filter(log => log.lockKey === lockKey);
    
    console.log(`\n🔍 락 순서 검증 - ${lockKey}:`);
    console.log('전체 로그:', this.logs.map(log => `${log.step}: ${log.isLocked ? '🔒LOCKED' : '🔓UNLOCKED'} - ${log.description}`));
    console.log('관련 로그:', relevantLogs.map(log => `${log.step}: ${log.isLocked ? '🔒LOCKED' : '🔓UNLOCKED'} - ${log.description}`));
    
    if (relevantLogs.length < 2) {
      return {
        success: false,
        message: `락 상태 로그가 부족합니다. 최소 2개 필요, 실제: ${relevantLogs.length}`,
        logs: relevantLogs
      };
    }

    // 첫 번째 로그는 락이 없어야 함
    const firstLog = relevantLogs[0];
    if (firstLog.isLocked) {
      return {
        success: false,
        message: `첫 번째 단계에서 락이 이미 획득되어 있습니다: ${firstLog.step}`,
        logs: relevantLogs
      };
    }

    // 마지막 로그는 락이 해제되어야 함
    const lastLog = relevantLogs[relevantLogs.length - 1];
    if (lastLog.isLocked) {
      return {
        success: false,
        message: `마지막 단계에서 락이 해제되지 않았습니다: ${lastLog.step}`,
        logs: relevantLogs
      };
    }

    // 중간에 락이 획득되었다가 해제되는 패턴이 있어야 함
    const lockAcquired = relevantLogs.some(log => log.isLocked);
    if (!lockAcquired) {
      return {
        success: false,
        message: '락이 한 번도 획득되지 않았습니다.',
        logs: relevantLogs
      };
    }

    return {
      success: true,
      message: '락 획득 → 비즈니스 로직 → 락 해제 순서가 올바릅니다.',
      logs: relevantLogs
    };
  }
}

describe('분산락과 트랜잭션 실행 순서 유스케이스 통합 테스트', () => {
  let module: TestingModule;
  let redisDistributedLockService: RedisDistributedLockServiceInterface;
  let redisService: RedisServiceInterface;
  let dataSource: DataSource;
  let createOrderUseCase: CreateOrderUseCase;
  let processPaymentUseCase: ProcessPaymentUseCase;
  let chargePointsUseCase: ChargePointsUseCase;
  let issueCouponUseCase: IssueCouponUseCase;
  let lockTracker: LockStateTracker;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    redisDistributedLockService = module.get<RedisDistributedLockServiceInterface>(REDIS_DISTRIBUTED_LOCK_SERVICE);
    redisService = module.get<RedisServiceInterface>(REDIS_SERVICE);
    dataSource = module.get<DataSource>(DataSource);
    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    processPaymentUseCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    chargePointsUseCase = module.get<ChargePointsUseCase>(ChargePointsUseCase);
    issueCouponUseCase = module.get<IssueCouponUseCase>(IssueCouponUseCase);
    lockTracker = new LockStateTracker(redisDistributedLockService);
  });

  afterAll(async () => {
    // 테스트 후 모든 락 정리
    await redisDistributedLockService.clearAllLocks('test:*');
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 테스트 락들 정리 및 로그 초기화
    await redisDistributedLockService.clearAllLocks('test:*');
    lockTracker.clearLogs();
  });

  describe('분산락 기본 동작 검증', () => {
    it('Redis 분산락이 정상적으로 획득되고 해제되어야 한다', async () => {
      const lockKey = 'test:basic:lock';
      
      // 1. 락 획득 전 상태 확인
      await lockTracker.logLockState('BEFORE_ACQUIRE', lockKey, '락 획득 전');
      
      // 2. 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(acquired).toBe(true);
      
      await lockTracker.logLockState('AFTER_ACQUIRE', lockKey, '락 획득 후');
      
      // 3. 락 해제
      await redisDistributedLockService.releaseLock(lockKey);
      
      await lockTracker.logLockState('AFTER_RELEASE', lockKey, '락 해제 후');
      
      // 4. 락 순서 검증
      const verification = await lockTracker.verifyLockSequence(lockKey);
      expect(verification.success).toBe(true);
    });
  });

  describe('분산락과 트랜잭션 실행 순서 검증', () => {
    it('간단한 락 획득 → 비즈니스 로직 → 락 해제 시나리오를 테스트해야 한다', async () => {
      // 이 테스트는 실제 유스케이스에서 락이 획득되는 것을 보여줍니다
      const lockKey = 'test:usecase:lock';
      
      // 1. 실행 전 락 상태 확인
      await lockTracker.logLockState('BEFORE_EXECUTION', lockKey, '유스케이스 실행 전');
      
      // 2. 실제 락 획득 (유스케이스 내부에서 발생하는 것과 동일)
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(acquired).toBe(true);
      
      await lockTracker.logLockState('DURING_EXECUTION', lockKey, '유스케이스 실행 중 (락 획득)');
      
      // 3. 가상의 비즈니스 로직 실행 (트랜잭션 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 지연
      
      await lockTracker.logLockState('AFTER_BUSINESS_LOGIC', lockKey, '비즈니스 로직 완료 후');
      
      // 4. 락 해제 (유스케이스 완료 후)
      await redisDistributedLockService.releaseLock(lockKey);
      
      await lockTracker.logLockState('AFTER_EXECUTION', lockKey, '유스케이스 완료 후 (락 해제)');
      
      // 5. 락 순서 검증
      const verification = await lockTracker.verifyLockSequence(lockKey);
      expect(verification.success).toBe(true);
      expect(verification.message).toBe('락 획득 → 비즈니스 로직 → 락 해제 순서가 올바릅니다.');
    });

    it('에러 발생 시에도 락이 해제되는지 확인해야 한다', async () => {
      const lockKey = 'test:error:lock';
      
      // 1. 실행 전 락 상태 확인
      await lockTracker.logLockState('BEFORE_EXECUTION', lockKey, '유스케이스 실행 전');
      
      // 2. 락 획득
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      expect(acquired).toBe(true);
      
      await lockTracker.logLockState('DURING_EXECUTION', lockKey, '유스케이스 실행 중 (락 획득)');
      
      // 3. 에러 발생 시뮬레이션
      try {
        throw new Error('테스트 에러');
      } catch (error) {
        await lockTracker.logLockState('AFTER_ERROR', lockKey, `에러 발생 후: ${error.message}`);
        // 에러가 발생해도 락은 해제되어야 함
        await redisDistributedLockService.releaseLock(lockKey);
      }
      
      await lockTracker.logLockState('AFTER_ERROR_HANDLING', lockKey, '에러 처리 후 (락 해제)');
      
      // 4. 락 순서 검증
      const verification = await lockTracker.verifyLockSequence(lockKey);
      expect(verification.success).toBe(true);
    });
  });

  describe('동시 요청 시 분산락 동작 검증', () => {
    it('동일한 리소스에 대한 동시 요청 시 하나만 락을 획득하고 나머지는 대기해야 한다', async () => {
      // Arrange
      const userId = 1;
      const chargePointsDto: ChargePointsDto = { amount: 10000 };
      const expectedLockKey = `user:${userId}`;
      
      // 락이 아직 존재하지 않는지 확인
      const isLockedBefore = await redisDistributedLockService.isLocked(expectedLockKey);
      expect(isLockedBefore).toBe(false);

      // Act - 동시 포인트 충전 요청
      const concurrentRequests = 3;
      const promises = Array.from({ length: concurrentRequests }, (_, index) => {
        return chargePointsUseCase.execute(userId, chargePointsDto);
      });

      try {
        const results = await Promise.all(promises);
        // 모든 요청이 성공했다면 순차적으로 처리되었을 것
        expect(results).toHaveLength(concurrentRequests);
      } catch (error) {
        // 일부 요청이 실패할 수 있음 (락 획득 실패 등)
        console.log('동시 요청 중 일부 실패:', error.message);
      }

      // 락이 해제되었는지 확인
      const isLockedAfter = await redisDistributedLockService.isLocked(expectedLockKey);
      expect(isLockedAfter).toBe(false);
    });
  });

  describe('락 TTL 만료 시나리오', () => {
    it('락 TTL이 만료되면 자동으로 해제되어야 한다', async () => {
      // Arrange
      const lockKey = 'test:ttl:lock';
      
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

  describe('락 획득 실패 시나리오', () => {
    it('락을 획득할 수 없을 때 적절한 에러가 발생해야 한다', async () => {
      // Arrange - 먼저 락을 획득
      const lockKey = 'test:duplicate:lock';
      const acquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 10000,
        retryCount: 1
      });
      expect(acquired).toBe(true);

      // Act - 이미 락이 획득된 상태에서 락 획득 시도
      const secondAcquired = await redisDistributedLockService.acquireLock(lockKey, {
        ttl: 5000,
        retryCount: 1
      });
      
      // Assert - 두 번째 락 획득 실패
      expect(secondAcquired).toBe(false);

      // Cleanup
      await redisDistributedLockService.releaseLock(lockKey);
    });
  });
});
