import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupon-service.interface';
import { PessimisticLock } from '../../../common/decorators/pessimistic-lock.decorator';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../interfaces/services/redis-distributed-lock-service.interface';

@Injectable()
export class IssueCouponUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    @Inject(REDIS_DISTRIBUTED_LOCK_SERVICE)
    private readonly redisDistributedLockService: RedisDistributedLockServiceInterface
  ) {}

  @PessimisticLock({
    key: 'coupon:issue:${args[0].couponType}',
    timeout: 5000,
    errorMessage: '쿠폰 발급 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    // Redis 분산 락으로 추가 보호 (보조적)
    const redisLockKey = `redis:coupon:issue:${issueCouponDto.couponType}`;
    
    const lockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: 3000, // 짧은 TTL (보조적이므로)
      retryCount: 2, // 재시도 횟수 증가
      retryDelay: 10 // 짧은 대기 시간
    });

    // Redis 락 실패해도 계속 진행 (보조적이므로)
    if (!lockAcquired) {
      console.log(`Redis 락 획득 실패: ${redisLockKey}, 하지만 계속 진행`);
    }

    try {
      // 기존 비관적 락이 DB 레벨에서 보호
      const coupon = await this.couponsService.issueCoupon(issueCouponDto);
      
      return {
        couponId: coupon.id,
        userId: coupon.userId,
        couponType: coupon.couponType,
        discountRate: coupon.discountRate,
        expiryDate: coupon.expiryDate.toISOString().split('T')[0],
        isUsed: coupon.isUsed
      };
    } finally {
      // Redis 락이 있었으면 해제
      if (lockAcquired) {
        await this.redisDistributedLockService.releaseLock(redisLockKey);
      }
    }
  }
} 