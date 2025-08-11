import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';
import { PessimisticLock } from '../../../common/decorators/pessimistic-lock.decorator';

@Injectable()
export class IssueCouponUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  @PessimisticLock({
    key: 'coupon:issue:${args[0].couponType}',
    timeout: 5000,
    errorMessage: '쿠폰 발급 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.couponsService.issueCoupon(issueCouponDto);
    return {
      couponId: coupon.id,
      userId: coupon.userId,
      couponType: coupon.couponType,
      discountRate: coupon.discountRate,
      expiryDate: coupon.expiryDate.toISOString().split('T')[0],
      isUsed: coupon.isUsed
    };
  }
} 