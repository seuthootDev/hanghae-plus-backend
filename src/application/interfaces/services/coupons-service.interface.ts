import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';

export const COUPONS_SERVICE = 'COUPONS_SERVICE';

export interface CouponsServiceInterface {
  issueCoupon(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto>;
  getUserCoupons(userId: number): Promise<CouponResponseDto[]>;
} 