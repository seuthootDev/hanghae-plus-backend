import { Injectable, Inject } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/users-service.interface';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';
import { OrderValidationService } from '../../../domain/services/order-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';
import { ProductSalesAggregationRepositoryInterface } from '../../interfaces/repositories/product-sales-aggregation-repository.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../interfaces/services/redis-distributed-lock-service.interface';

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
    @Inject('PRODUCT_SALES_AGGREGATION_REPOSITORY')
    private readonly aggregationRepository: ProductSalesAggregationRepositoryInterface,
    @Inject(REDIS_DISTRIBUTED_LOCK_SERVICE)
    private readonly redisDistributedLockService: RedisDistributedLockServiceInterface
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
    // Redis 분산 락으로 추가 보호 (보조적)
    const redisLockKey = `redis:order:create:${createOrderDto.userId}:${createOrderDto.items.map(item => `${item.productId}:${item.quantity}`).join(',')}`;
    
    const lockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: 5000, // 보조적이므로 짧은 TTL
      retryCount: 2, // 재시도 횟수 증가
      retryDelay: 10 // 짧은 대기 시간
    });

    // Redis 락 실패해도 계속 진행 (보조적이므로)
    if (!lockAcquired) {
      console.log(`Redis 락 획득 실패: ${redisLockKey}, 하지만 계속 진행`);
    }

    try {
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
      
      // 7. Redis + 집계 테이블 업데이트 (Use Case에서 조율)
      await this.updateSalesAggregation(orderItems);
      
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
    } catch (error) {
      // 결제 실패 시 재고 반환
      for (const item of createOrderDto.items) {
        const product = await this.productsService.findById(item.productId);
        if (product) {
          product.increaseStock(item.quantity);
          await this.productsService.save(product);
        }
      }
      throw error;
    } finally {
      // Redis 락이 있었으면 해제
      if (lockAcquired) {
        await this.redisDistributedLockService.releaseLock(redisLockKey);
      }
    }
  }

  private async updateSalesAggregation(orderItems: OrderItem[]): Promise<void> {
    for (const item of orderItems) {
      // Redis에 실시간 판매량 증가
      await this.redisService.incrementProductSales(item.productId, item.quantity);
      
      // DB 집계 테이블 업데이트 (배치 처리용)
      const currentSales = await this.redisService.getProductSales(item.productId);
      await this.aggregationRepository.updateSales(item.productId, currentSales, 0); // revenue는 별도 계산 필요
    }
  }
} 