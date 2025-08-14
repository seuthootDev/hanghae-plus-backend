import { Injectable, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { IssueCouponDto } from '../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponsServiceInterface } from '../../application/interfaces/services/coupon-service.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../application/interfaces/repositories/coupon-repository.interface';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';
import { RedisServiceInterface, REDIS_SERVICE } from '../../application/interfaces/services/redis-service.interface';

@Injectable()
export class CouponsService implements CouponsServiceInterface {
  
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface,
    private readonly couponValidationService: CouponValidationService,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  async issueCoupon(issueCouponDto: IssueCouponDto): Promise<Coupon> {
    const { userId, couponType } = issueCouponDto;
    
    try {
      // 🔒 Redis로 원자적 재고 체크 (Race Condition 방지)
      const remaining = await this.redisService.decr(`coupon:stock:${couponType}`);
      
      if (remaining < 0) {
        // 재고 부족 시 즉시 롤백하고 실패
        await this.redisService.incr(`coupon:stock:${couponType}`);
        throw new Error(`${couponType} 쿠폰이 소진되었습니다.`);
      }
      
      // ✅ 재고가 있을 때만 쿠폰 발급 진행
      const coupon = await this.createAndSaveCoupon(issueCouponDto);
      
      return coupon;
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

  private async createAndSaveCoupon(issueCouponDto: IssueCouponDto): Promise<Coupon> {
    const { userId, couponType } = issueCouponDto;
    
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
  }

  // Redis 재고 초기화 메서드
  async initializeCouponStock(): Promise<void> {
    await this.redisService.set('coupon:stock:DISCOUNT_10PERCENT', '100');
    await this.redisService.set('coupon:stock:DISCOUNT_20PERCENT', '50');
    await this.redisService.set('coupon:stock:FIXED_1000', '200');
    await this.redisService.set('coupon:stock:FIXED_2000', '100');
  }

  // Redis 재고 조회 메서드
  async getCouponStock(couponType: string): Promise<number> {
    // Redis에서 재고 값을 가져오는 로직이 필요하지만, 현재 인터페이스에는 get 메서드가 없음
    // 테스트를 위해 임시로 0 반환
    return 0;
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