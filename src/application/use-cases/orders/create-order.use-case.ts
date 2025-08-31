import { Injectable, Inject } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/order-service.interface';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/product-service.interface';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/user-service.interface';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupon-service.interface';
import { OrderValidationService } from '../../../domain/services/order-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';
import { OrderCreatedEvent } from '../../../domain/events/order-created.event';
import { OrderFailedEvent } from '../../../domain/events/order-failed.event';
import { IEventBus } from '../../../common/events/event-bus.interface';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface,
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    private readonly orderValidationService: OrderValidationService,
    private readonly userValidationService: UserValidationService,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface,
    @Inject('EVENT_BUS')
    private readonly eventBus: IEventBus
  ) {}

  @Transactional()
  @OptimisticLock({
    key: (args) => {
      const { userId, items } = args[0];
      const itemKeys = items.map(item => `${item.productId}:${item.quantity}`).join(',');
      return `order:create:${userId}:${itemKeys}`;
    },
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '주문 생성 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    try {
      return await this.createOrderInternal(createOrderDto);
    } catch (error) {
      // 주문 생성 실패 시 보상 트랜잭션 이벤트 발행
      await this.handleOrderCreationFailure(createOrderDto, error);
      throw error;
    }
  }

  private async createOrderInternal(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const { userId, items, couponId } = createOrderDto;
    
    // 1. 주문 상품 검증
    this.orderValidationService.validateOrderItems(items);
    
    // 2. 상품 조회, 검증 및 재고 차감 (ProductsService 사용)
    const productResult = await this.productsService.validateAndReserveProducts(items);
    if (!productResult) {
      throw new Error('상품 검증 및 재고 차감에 실패했습니다.');
    }
    const { products, orderItems, totalAmount } = productResult;
    
    // 3. 사용자 조회 및 검증 (UsersService 사용)
    const user = await this.usersService.validateUser(userId);
    
    // 4. 쿠폰 검증 및 할인 계산 (CouponsService 사용)
    const couponResult = await this.couponsService.validateAndCalculateDiscount(couponId, totalAmount);
    const { coupon, discountAmount, couponUsed } = couponResult;
    
    const finalAmount = totalAmount - discountAmount;
    
    // 5. 전체 주문 검증
    this.orderValidationService.validateOrder(
      items,
      products,
      user,
      coupon,
      totalAmount,
      finalAmount
    );
    
    // 6. 주문 생성 (OrdersService 사용)
    const order = await this.ordersService.createOrder({
      userId,
      orderItems,
      totalAmount,
      discountAmount,
      finalAmount,
      couponId,
      couponUsed
    });
    
    // 7. Redis Sorted Set 기반 상품 랭킹 업데이트
    await this.updateProductRanking(orderItems);
    
    // 8. 주문 생성 완료 이벤트 발행 (트랜잭션 완료 후)
    this.eventBus.publish(new OrderCreatedEvent(
      order.id.toString(),
      order.userId.toString(),
      order.items,
      order.totalAmount,
      order.discountAmount,
      order.finalAmount,
      order.couponId,
      order.couponUsed,
      new Date(),
      new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
    ));
    
    return {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      couponUsed: order.couponUsed,
      status: order.status
    };
  }

  private async updateProductRanking(orderItems: OrderItem[]): Promise<void> {
    // 오늘 날짜 키 생성 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    const dailyRankingKey = `product:ranking:${today}`;
    
    for (const item of orderItems) {
      try {
        // 일일 랭킹에 판매량 추가
        const currentDailyScore = await this.redisService.zscore(dailyRankingKey, item.productId.toString());
        const newDailyScore = (currentDailyScore || 0) + item.quantity;
        
        // 일일 랭킹 업데이트
        await this.redisService.zadd(dailyRankingKey, newDailyScore, item.productId.toString());
        
        // 일일 데이터는 4일 후 만료 (3일 + 1일 여유)
        await this.redisService.expire(dailyRankingKey, 4 * 24 * 60 * 60);
        
      } catch (error) {
        console.warn(`⚠️ 상품 ${item.productId} 랭킹 업데이트 실패:`, error.message);
        // 랭킹 업데이트 실패해도 주문은 성공
      }
    }
  }

  /**
   * 주문 생성 실패 시 보상 트랜잭션 이벤트 발행
   */
  private async handleOrderCreationFailure(createOrderDto: CreateOrderDto, error: any): Promise<void> {
    try {
      const { userId, items, couponId } = createOrderDto;
      
      // 주문 실패 이벤트 발행
      this.eventBus.publish(new OrderFailedEvent(
        'TEMP_' + Date.now(), // 임시 주문 ID
        userId.toString(),
        items,
        couponId,
        error.message || '주문 생성 실패',
        new Date()
      ));
    } catch (eventError) {
      // 이벤트 발행 실패는 로깅만 하고 원래 에러를 던지지 않음
      console.error('주문 실패 이벤트 발행 실패:', eventError);
    }
  }
} 