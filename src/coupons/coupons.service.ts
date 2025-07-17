import { Injectable, BadRequestException } from '@nestjs/common';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';

@Injectable()
export class CouponsService {
  
  async issueCoupon(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    // Mock 비즈니스 로직: 쿠폰 발급
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
    
    // Mock 쿠폰 소진 체크 (선착순 발급)
    const mockIssuedCoupons = {
      'DISCOUNT_10PERCENT': 95, // 100개 중 95개 발급됨
      'DISCOUNT_20PERCENT': 100, // 100개 중 100개 발급됨 (소진)
      'FIXED_1000': 80,
      'FIXED_2000': 90
    };
    
    const issuedCount = mockIssuedCoupons[couponType];
    if (issuedCount >= 100) {
      throw new BadRequestException('쿠폰이 소진되었습니다.');
    }
    
    // 유효기간 계산
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + config.expiryDays);
    
    return {
      couponId: Math.floor(Math.random() * 1000) + 10,
      userId,
      couponType,
      discountRate: config.discountRate,
      expiryDate: expiryDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
      isUsed: false
    };
  }

  async getUserCoupons(userId: number): Promise<CouponResponseDto[]> {
    // Mock 비즈니스 로직: 보유 쿠폰 조회
    const mockUserCoupons: CouponResponseDto[] = [
      {
        couponId: 10,
        userId: 1,
        couponType: 'DISCOUNT_10PERCENT',
        discountRate: 10,
        expiryDate: '2024-12-31',
        isUsed: false
      },
      {
        couponId: 11,
        userId: 1,
        couponType: 'FIXED_1000',
        discountRate: 0,
        expiryDate: '2024-11-30',
        isUsed: true
      },
      {
        couponId: 12,
        userId: 1,
        couponType: 'DISCOUNT_20PERCENT',
        discountRate: 20,
        expiryDate: '2024-10-15',
        isUsed: false
      }
    ];
    
    // 사용자별 쿠폰 필터링
    return mockUserCoupons.filter(coupon => coupon.userId === userId);
  }
} 