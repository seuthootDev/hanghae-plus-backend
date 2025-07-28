import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { Coupon } from '../../../domain/entities/coupon.entity';

export const COUPONS_SERVICE = 'COUPONS_SERVICE';

export interface CouponsServiceInterface {
  issueCoupon(issueCouponDto: IssueCouponDto): Promise<Coupon>;
  getUserCoupons(userId: number): Promise<Coupon[]>;
} 