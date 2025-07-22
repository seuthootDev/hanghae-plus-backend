import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface } from '../../application/interfaces/services/coupons-service.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../application/interfaces/repositories/coupon-repository.interface';
import { Coupon } from '../../domain/entities/coupon.entity';

@Injectable()
export class CouponsService implements CouponsServiceInterface {
  
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface
  ) {}

  async issueCoupon(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    const { userId, couponType } = issueCouponDto;
    
    // 쿠폰 타입별 설정
    const couponConfigs = {
      'DISCOUNT_10PERCENT': { discountRate: 10, expiryDays: 30 },
      'DISCOUNT_20PERCENT': { discountRate: 20, expiryDays: 30 },
      'FIXED_1000': { discountRate: 0, discountAmount: 1000, expiryDays: 30 },
      'FIXED_2000': { discountRate: 0, discountAmount: 2000, expiryDays: 30 }
    };
    
    const config = couponConfigs[couponType];
    if (!config) {
      throw new BadRequestException(`유효하지 않은 쿠폰 타입입니다: ${couponType}`);
    }
    
    // 쿠폰 소진 체크
    const existingCoupons = await this.couponRepository.findByType(couponType);
    if (existingCoupons.length >= 100) {
      throw new BadRequestException('쿠폰이 소진되었습니다.');
    }
    
    // 유효기간 계산
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + config.expiryDays);
    
    // 쿠폰 생성
    const coupon = new Coupon(
      0, // ID는 저장 시 할당
      userId,
      couponType,
      config.discountRate,
      'discountAmount' in config ? config.discountAmount : 0,
      expiryDate,
      false // isUsed
    );
    
    // 쿠폰 저장
    const savedCoupon = await this.couponRepository.save(coupon);
    
    return {
      couponId: savedCoupon.id,
      userId: savedCoupon.userId,
      couponType: savedCoupon.couponType,
      discountRate: savedCoupon.discountRate,
      expiryDate: savedCoupon.expiryDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
      isUsed: savedCoupon.isUsed
    };
  }

  async getUserCoupons(userId: number): Promise<CouponResponseDto[]> {
    const coupons = await this.couponRepository.findByUserId(userId);
    
    return coupons.map(coupon => ({
      couponId: coupon.id,
      userId: coupon.userId,
      couponType: coupon.couponType,
      discountRate: coupon.discountRate,
      expiryDate: coupon.expiryDate.toISOString().split('T')[0],
      isUsed: coupon.isUsed
    }));
  }
} 