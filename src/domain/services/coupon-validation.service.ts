import { Coupon } from '../entities/coupon.entity';

export class CouponValidationService {
  
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
  validateCouponAvailability(existingCoupons: Coupon[]): void {
    if (existingCoupons.length >= 100) {
      throw new Error('쿠폰이 소진되었습니다.');
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
    this.validateCouponAvailability(existingCoupons);
  }

  /**
   * 쿠폰 사용 전체 검증
   */
  validateCouponUsageForOrder(coupon: Coupon, totalAmount: number): void {
    this.validateCouponValidity(coupon);
    this.validateCouponUsage(coupon);
    this.validateDiscountCalculation(coupon, totalAmount);
  }
} 