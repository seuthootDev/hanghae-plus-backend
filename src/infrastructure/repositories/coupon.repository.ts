import { Injectable } from '@nestjs/common';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponRepositoryInterface } from '../../application/interfaces/repositories/coupon-repository.interface';

@Injectable()
export class CouponRepository implements CouponRepositoryInterface {
  private coupons: Map<number, Coupon> = new Map();
  private nextCouponId = 10;

  constructor() {
    // Mock 데이터 초기화
    const expiryDate1 = new Date();
    expiryDate1.setDate(expiryDate1.getDate() + 30);

    const expiryDate2 = new Date();
    expiryDate2.setDate(expiryDate2.getDate() + 15);

    const coupon1 = new Coupon(
      this.nextCouponId++,
      1, // userId
      'DISCOUNT_10PERCENT',
      10, // discountRate
      0, // discountAmount
      expiryDate1,
      false // isUsed
    );

    const coupon2 = new Coupon(
      this.nextCouponId++,
      1, // userId
      'FIXED_1000',
      0, // discountRate
      1000, // discountAmount
      expiryDate2,
      true // isUsed
    );

    this.coupons.set(coupon1.id, coupon1);
    this.coupons.set(coupon2.id, coupon2);
  }

  async findById(id: number): Promise<Coupon | null> {
    return this.coupons.get(id) || null;
  }

  async save(coupon: Coupon): Promise<Coupon> {
    if (!coupon.id) {
      // 새 쿠폰인 경우 ID 할당
      const newCoupon = new Coupon(
        this.nextCouponId++,
        coupon.userId,
        coupon.couponType,
        coupon.discountRate,
        coupon.discountAmount,
        coupon.expiryDate,
        coupon.isUsed
      );
      this.coupons.set(newCoupon.id, newCoupon);
      return newCoupon;
    } else {
      // 기존 쿠폰 업데이트
      this.coupons.set(coupon.id, coupon);
      return coupon;
    }
  }

  async findByUserId(userId: number): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(coupon => coupon.userId === userId);
  }

  async findByType(couponType: string): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(coupon => coupon.couponType === couponType);
  }
} 