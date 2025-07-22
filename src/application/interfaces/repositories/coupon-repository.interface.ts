import { Coupon } from '../../../domain/entities/coupon.entity';

export const COUPON_REPOSITORY = 'COUPON_REPOSITORY';

export interface CouponRepositoryInterface {
  findById(id: number): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<Coupon>;
  findByUserId(userId: number): Promise<Coupon[]>;
  findByType(couponType: string): Promise<Coupon[]>;
} 