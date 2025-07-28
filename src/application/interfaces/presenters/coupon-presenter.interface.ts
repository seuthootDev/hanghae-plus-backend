import { Coupon } from '../../../domain/entities/coupon.entity';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';

export const COUPON_PRESENTER = 'COUPON_PRESENTER';

export interface CouponPresenterInterface {
  presentCoupon(coupon: Coupon): CouponResponseDto;
  presentCouponList(coupons: Coupon[]): CouponResponseDto[];
} 