import { Coupon } from '../entities/coupon.entity';

export class CouponValidationService {
  
  // 쿠폰 타입별 발급 제한 수량
  private readonly COUPON_LIMITS = {
    'DISCOUNT_10PERCENT': 100,  // 10% 할인 쿠폰: 100개
    'DISCOUNT_20PERCENT': 50,   // 20% 할인 쿠폰: 50개 (더 희귀)
    'FIXED_1000': 200,          // 1000원 할인 쿠폰: 200개 (많이)
    'FIXED_2000': 100           // 2000원 할인 쿠폰: 100개
  };
  
  /**
   * 쿠폰 타입 검증
   */
  validateCouponType(couponType: string): void {
    const validTypes = [
      'DISCOUNT_10PERCENT',
      'DISCOUNT_20PERCENT', 
      'FIXED_1000',
      'FIXED_2000'
    ];
    
    if (!validTypes.includes(couponType)) {
      throw new Error(`유효하지 않은 쿠폰 타입입니다: ${couponType}`);
    }
  }

  /**
   * 쿠폰 소진 여부 검증
   */
  validateCouponAvailability(couponType: string, existingCoupons: Coupon[]): void {
    const limit = this.COUPON_LIMITS[couponType];
    if (!limit) {
      throw new Error(`알 수 없는 쿠폰 타입입니다: ${couponType}`);
    }
    
    if (existingCoupons.length >= limit) {
      throw new Error(`${couponType} 쿠폰이 소진되었습니다. (제한: ${limit}개)`);
    }
  }

  /**
   * 쿠폰 유효성 검증
   */
  validateCouponValidity(coupon: Coupon): void {
    if (!coupon.isValid()) {
      throw new Error('유효하지 않은 쿠폰입니다.');
    }
  }

  /**
   * 쿠폰 사용 가능 여부 검증
   */
  validateCouponUsage(coupon: Coupon): void {
    if (coupon.isUsed) {
      throw new Error('이미 사용된 쿠폰입니다.');
    }
    
    if (coupon.isExpired()) {
      throw new Error('만료된 쿠폰입니다.');
    }
  }

  /**
   * 쿠폰 할인 계산 검증
   */
  validateDiscountCalculation(coupon: Coupon, totalAmount: number): void {
    const discount = coupon.calculateDiscount(totalAmount);
    
    if (discount < 0) {
      throw new Error('할인 금액은 음수일 수 없습니다.');
    }
    
    if (discount > totalAmount) {
      throw new Error('할인 금액은 총 금액을 초과할 수 없습니다.');
    }
  }

  /**
   * 쿠폰 발급 전체 검증
   */
  validateCouponIssuance(couponType: string, existingCoupons: Coupon[]): void {
    this.validateCouponType(couponType);
    this.validateCouponAvailability(couponType, existingCoupons);
  }

  /**
   * 쿠폰 사용 전체 검증
   */
  validateCouponUsageForOrder(coupon: Coupon, totalAmount: number): void {
    this.validateCouponValidity(coupon);
    this.validateCouponUsage(coupon);
    this.validateDiscountCalculation(coupon, totalAmount);
  }

  /**
   * 쿠폰 발급 가능 여부 확인
   */
  canIssueCoupon(couponType: string, existingCoupons: Coupon[]): boolean {
    const limit = this.COUPON_LIMITS[couponType];
    if (!limit) {
      return false;
    }
    return existingCoupons.length < limit;
  }

  /**
   * 남은 쿠폰 수량 확인
   */
  getRemainingCouponCount(couponType: string, existingCoupons: Coupon[]): number {
    const limit = this.COUPON_LIMITS[couponType];
    if (!limit) {
      return 0;
    }
    return Math.max(0, limit - existingCoupons.length);
  }

  /**
   * 쿠폰 타입별 제한 수량 조회
   */
  getCouponLimit(couponType: string): number {
    return this.COUPON_LIMITS[couponType] || 0;
  }
} 