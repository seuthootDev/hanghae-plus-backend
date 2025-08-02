import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../interfaces/repositories/product-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../interfaces/repositories/coupon-repository.interface';
import { OrderValidationService } from '../../../domain/services/order-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { Order, OrderItem } from '../../../domain/entities/order.entity';
import { RedisService } from '../../../infrastructure/services/redis.service';
import { ProductSalesAggregationRepositoryInterface } from '../../interfaces/repositories/product-sales-aggregation-repository.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface,
    private readonly orderValidationService: OrderValidationService,
    private readonly userValidationService: UserValidationService,
    private readonly redisService: RedisService,
    @Inject('PRODUCT_SALES_AGGREGATION_REPOSITORY')
    private readonly aggregationRepository: ProductSalesAggregationRepositoryInterface
  ) {}

  @Transactional()
  async execute(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const { userId, items, couponId } = createOrderDto;
    const products: any[] = [];
    
    try {
      // 1. 주문 상품 검증
      this.orderValidationService.validateOrderItems(items);
      
      // 2. 상품 조회 및 검증
      const orderItems: OrderItem[] = [];
      let totalAmount = 0;
      
      for (const item of items) {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundException('상품을 찾을 수 없습니다.');
        }
        
        products.push(product);
        
        // 상품 검증
        this.orderValidationService.validateProduct(product, item.quantity);
        
        // 재고 차감
        product.decreaseStock(item.quantity);
        await this.productRepository.save(product);
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
        
        totalAmount += product.price * item.quantity;
      }
      
      // 3. 사용자 조회 및 검증
      const user = await this.userRepository.findById(userId);
      this.userValidationService.validateUserExists(user);
      
      // 4. 쿠폰 조회 및 할인 계산
      let discountAmount = 0;
      let couponUsed = false;
      let coupon: any = null;
      
      if (couponId) {
        coupon = await this.couponRepository.findById(couponId);
        if (coupon && coupon.isValid()) {
          discountAmount = coupon.calculateDiscount(totalAmount);
          couponUsed = true;
        }
      }
      
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
      
      // 6. 주문 생성
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
      for (const product of products) {
        if (product) {
          product.increaseStock(items.find(item => item.productId === product.id)?.quantity || 0);
          await this.productRepository.save(product);
        }
      }
      throw error;
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