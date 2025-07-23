import { Injectable } from '@nestjs/common';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponResponseDto } from '../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponPresenterInterface } from '../../application/interfaces/presenters/coupon-presenter.interface';

@Injectable()
export class CouponPresenter implements CouponPresenterInterface {
  
  presentCoupon(coupon: Coupon): CouponResponseDto {
    return {
      couponId: coupon.id,
      userId: coupon.userId,
      couponType: coupon.couponType,
      discountRate: coupon.discountRate,
      expiryDate: coupon.expiryDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
      isUsed: coupon.isUsed
    };
  }

  presentCouponList(coupons: Coupon[]): CouponResponseDto[] {
    return coupons.map(coupon => this.presentCoupon(coupon));
  }
} 