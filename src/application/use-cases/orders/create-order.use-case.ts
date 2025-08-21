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
    private readonly redisService: RedisServiceInterface
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
    const rankingKey = 'product:ranking';
    
    for (const item of orderItems) {
      try {
        // Redis Sorted Set에서 해당 상품의 현재 점수 조회
        const currentScore = await this.redisService.zscore(rankingKey, item.productId.toString());
        const newScore = (currentScore || 0) + item.quantity; // 판매량을 점수로 사용
        
        // 상품 랭킹 업데이트 (판매량 증가)
        await this.redisService.zadd(rankingKey, newScore, item.productId.toString());
        
        console.log(`📈 상품 ${item.productId} 랭킹 업데이트: ${currentScore || 0} → ${newScore}`);
      } catch (error) {
        console.warn(`⚠️ 상품 ${item.productId} 랭킹 업데이트 실패:`, error.message);
        // 랭킹 업데이트 실패해도 주문은 성공
      }
    }
  }
} 