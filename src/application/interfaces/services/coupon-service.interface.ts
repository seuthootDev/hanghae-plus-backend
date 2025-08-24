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
  
  // Redis Sorted Set 기반 선착순 쿠폰 발급 관련 메서드들
  getCouponRanking(couponType: string, limit?: number): Promise<Array<{
    userId: number;
    rank: number;
    issuedAt: number;
  }>>;
  
  getCouponQueueStatus(couponType: string): Promise<{
    totalIssued: number;
    totalInQueue: number;
    remainingStock: number;
    isEnded: boolean;
  }>;
} 