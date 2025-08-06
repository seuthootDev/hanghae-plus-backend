import { Injectable, Inject } from '@nestjs/common';
import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/users-service.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../interfaces/services/redis-distributed-lock-service.interface';

@Injectable()
export class ChargePointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
    @Inject(REDIS_DISTRIBUTED_LOCK_SERVICE)
    private readonly redisDistributedLockService: RedisDistributedLockServiceInterface
  ) {}

  @Transactional()
  @OptimisticLock({
    key: 'user:${args[0]}',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '포인트 충전 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    // Redis 분산 락으로 추가 보호 (보조적)
    const redisLockKey = `redis:user:points:${userId}`;
    
    const lockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: 2000, // 짧은 TTL (보조적이므로)
      retryCount: 2, // 재시도 횟수 증가
      retryDelay: 10 // 짧은 대기 시간
    });

    // Redis 락 실패해도 계속 진행 (보조적이므로)
    if (!lockAcquired) {
      console.log(`Redis 락 획득 실패: ${redisLockKey}, 하지만 계속 진행`);
    }

    try {
      // 기존 낙관적 락이 DB 레벨에서 보호
      const updatedUser = await this.usersService.chargePoints(userId, chargePointsDto);
      
      return {
        userId: updatedUser.id,
        balance: updatedUser.points
      };
    } finally {
      // Redis 락이 있었으면 해제
      if (lockAcquired) {
        await this.redisDistributedLockService.releaseLock(redisLockKey);
      }
    }
  }
} 