import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupon-service.interface';

@Injectable()
export class IssueCouponUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  async execute(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    // Redis Sorted Set 기반 선착순 쿠폰 발급 (분산락 불필요)
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