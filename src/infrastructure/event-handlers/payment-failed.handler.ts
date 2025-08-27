import { Injectable, Logger, Inject } from '@nestjs/common';
import { PaymentFailedEvent } from '../../domain/events/payment-failed.event';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../application/interfaces/services/product-service.interface';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../application/interfaces/services/coupon-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../application/interfaces/services/redis-service.interface';

@Injectable()
export class PaymentFailedHandler {
  private readonly logger = new Logger(PaymentFailedHandler.name);

  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  /**
   * 결제 처리 실패 이벤트 처리
   * 시간 초과인 경우에만 보상 트랜잭션 수행
   */
  async handle(event: PaymentFailedEvent): Promise<void> {
    try {
      this.logger.log(`🎯 결제 처리 실패 이벤트 처리 시작: 주문 ${event.orderId}`);
      
      if (event.isTimeout) {
        // 10분 초과로 인한 실패 - 보상 트랜잭션 수행
        this.logger.log(`⏰ 주문 ${event.orderId} 결제 시간 초과로 인한 보상 트랜잭션 시작`);
        
        // 1. 재고 복구
        await this.restoreProductStock(event.items);
        
        // 2. 쿠폰 복구 (쿠폰을 사용한 경우)
        if (event.couponId) {
          await this.restoreCouponUsage(event.couponId);
        }
        
        // 3. Redis 랭킹 복구
        await this.restoreProductRanking(event.items);
        
        this.logger.log(`✅ 주문 ${event.orderId} 시간 초과 보상 트랜잭션 완료`);
      } else {
        // 일반 결제 실패 (카드 오류 등) - 보상 트랜잭션 불필요
        this.logger.log(`💳 주문 ${event.orderId} 일반 결제 실패: ${event.failureReason}`);
        this.logger.log(`ℹ️ 사용자가 다시 결제를 시도할 수 있습니다.`);
      }
      
      this.logger.log(`✅ 결제 처리 실패 이벤트 처리 완료: 주문 ${event.orderId}`);
    } catch (error) {
      this.logger.error(`❌ 결제 처리 실패 이벤트 처리 실패: 주문 ${event.orderId}`, error);
      // 보상 트랜잭션 실패는 심각한 문제이므로 예외 전파
      if (event.isTimeout) {
        throw error;
      }
    }
  }

  /**
   * 상품 재고 복구
   */
  private async restoreProductStock(items: any[]): Promise<void> {
    for (const item of items) {
      try {
        const product = await this.productsService.findById(item.productId);
        if (!product) {
          throw new Error(`상품 ${item.productId}를 찾을 수 없습니다.`);
        }
        
        // 재고 증가
        product.increaseStock(item.quantity);
        await this.productsService.save(product);
        this.logger.log(`✅ 상품 ${item.productId} 재고 복구 완료: +${item.quantity}`);
      } catch (error) {
        this.logger.error(`❌ 상품 ${item.productId} 재고 복구 실패:`, error);
        throw error; // 재고 복구 실패는 심각한 문제
      }
    }
  }

  /**
   * 쿠폰 사용 상태 복구
   */
  private async restoreCouponUsage(couponId: number): Promise<void> {
    try {
      const coupon = await this.couponsService.findById(couponId);
      if (!coupon) {
        throw new Error(`쿠폰 ${couponId}를 찾을 수 없습니다.`);
      }
      
      if (coupon.isUsed) {
        // 쿠폰 사용 상태 되돌리기
        coupon.revertUsage();
        await this.couponsService.save(coupon);
        this.logger.log(`✅ 쿠폰 ${couponId} 사용 상태 복구 완료`);
      }
    } catch (error) {
      this.logger.error(`❌ 쿠폰 ${couponId} 사용 상태 복구 실패:`, error);
      throw error; // 쿠폰 복구 실패는 심각한 문제
    }
  }

  /**
   * Redis 상품 랭킹 복구
   */
  private async restoreProductRanking(items: any[]): Promise<void> {
    // 오늘 날짜 키 생성 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    const dailyRankingKey = `product:ranking:${today}`;
    
    for (const item of items) {
      try {
        // 일일 랭킹에서 판매량 차감
        const currentDailyScore = await this.redisService.zscore(dailyRankingKey, item.productId.toString());
        if (currentDailyScore !== null) {
          const newDailyScore = Math.max(0, currentDailyScore - item.quantity);
          await this.redisService.zadd(dailyRankingKey, newDailyScore, item.productId.toString());
          this.logger.log(`✅ 상품 ${item.productId} 랭킹 복구 완료: -${item.quantity}`);
        }
      } catch (itemError) {
        console.error(`❌ 상품 ${item.productId} 랭킹 복구 실패:`, itemError);
        // 개별 상품 랭킹 복구 실패는 로깅만 하고 계속 진행
      }
    }
  }
}
