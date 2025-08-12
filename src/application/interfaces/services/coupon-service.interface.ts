import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { Coupon } from '../../../domain/entities/coupon.entity';

export const COUPONS_SERVICE = 'COUPONS_SERVICE';

export interface CouponsServiceInterface {
  issueCoupon(issueCouponDto: IssueCouponDto): Promise<Coupon>;
  getUserCoupons(userId: number): Promise<Coupon[]>;
  validateAndCalculateDiscount(couponId: number | null, totalAmount: number): Promise<{
    coupon: Coupon | null;
    discountAmount: number;
    couponUsed: boolean;
  }>;
  findById(couponId: number): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<Coupon>;
} 