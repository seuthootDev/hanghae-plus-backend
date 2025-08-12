import { Injectable, Inject } from '@nestjs/common';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupon-service.interface';

@Injectable()
export class GetUserCouponsUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  async execute(userId: number): Promise<CouponResponseDto[]> {
    const coupons = await this.couponsService.getUserCoupons(userId);
    return coupons.map(coupon => ({
      couponId: coupon.id,
      userId: coupon.userId,
      couponType: coupon.couponType,
      discountRate: coupon.discountRate,
      expiryDate: coupon.expiryDate.toISOString().split('T')[0],
      isUsed: coupon.isUsed
    }));
  }
} 