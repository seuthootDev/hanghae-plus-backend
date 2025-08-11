import { Injectable, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { IssueCouponDto } from '../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface } from '../../application/interfaces/services/coupons-service.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../application/interfaces/repositories/coupon-repository.interface';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';

@Injectable()
export class CouponsService implements CouponsServiceInterface {
  
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface,
    private readonly couponValidationService: CouponValidationService
  ) {}

  async issueCoupon(issueCouponDto: IssueCouponDto): Promise<Coupon> {
    const { userId, couponType } = issueCouponDto;
    
    try {
      // 쿠폰 소진 체크
      const existingCoupons = await this.couponRepository.findByType(couponType);
      
      // 도메인 서비스를 사용한 쿠폰 발급 검증
      this.couponValidationService.validateCouponIssuance(couponType, existingCoupons);
      
      // 쿠폰 타입별 설정
      const couponConfigs = {
        'DISCOUNT_10PERCENT': { discountRate: 10, expiryDays: 30 },
        'DISCOUNT_20PERCENT': { discountRate: 20, expiryDays: 30 },
        'FIXED_1000': { discountRate: 0, discountAmount: 1000, expiryDays: 30 },
        'FIXED_2000': { discountRate: 0, discountAmount: 2000, expiryDays: 30 }
      };
      
      const config = couponConfigs[couponType];
      
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
      
      return savedCoupon;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('유효하지 않은 쿠폰 타입입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('쿠폰이 소진되었습니다')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async getUserCoupons(userId: number): Promise<Coupon[]> {
    const coupons = await this.couponRepository.findByUserId(userId);
    return coupons;
  }

  // 주문에서 사용할 메서드들
  async validateAndCalculateDiscount(couponId: number | null, totalAmount: number): Promise<{
    coupon: Coupon | null;
    discountAmount: number;
    couponUsed: boolean;
  }> {
    if (!couponId) {
      return { coupon: null, discountAmount: 0, couponUsed: false };
    }

    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      return { coupon: null, discountAmount: 0, couponUsed: false };
    }

    // 쿠폰 유효성 검증
    this.couponValidationService.validateCouponUsage(coupon);

    if (coupon.isValid()) {
      const discountAmount = coupon.calculateDiscount(totalAmount);
      return { coupon, discountAmount, couponUsed: true };
    }

    return { coupon: null, discountAmount: 0, couponUsed: false };
  }

  async findById(couponId: number): Promise<Coupon | null> {
    return this.couponRepository.findById(couponId);
  }

  async save(coupon: Coupon): Promise<Coupon> {
    return this.couponRepository.save(coupon);
  }
} 