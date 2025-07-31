import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../interfaces/repositories/product-repository.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../interfaces/repositories/coupon-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { OrderValidationService } from '../../../domain/services/order-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { OrderItem } from '../../../domain/entities/order.entity';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly orderValidationService: OrderValidationService,
    private readonly userValidationService: UserValidationService
  ) {}

  @Transactional()
  async execute(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const { userId, items, couponId } = createOrderDto;
    
    try {
      // 1. 주문 상품 검증
      this.orderValidationService.validateOrderItems(items);
      
      // 2. 상품 조회 및 검증
      const products: any[] = [];
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
      
      // 6. 주문 생성 (간소화된 서비스 사용)
      const order = await this.ordersService.createOrder({
        userId,
        orderItems,
        totalAmount,
        discountAmount,
        finalAmount,
        couponId: couponUsed ? couponId : null,
        couponUsed
      });
      
      return {
        orderId: order.id,
        userId: order.userId,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        couponUsed: order.couponUsed,
        status: order.status
      };
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('주문 상품이 필요합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('상품 ID와 수량은 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('수량은 1개 이상이어야 합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('상품을 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('재고가 부족합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('포인트가 부족합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('유효하지 않은 쿠폰입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('주문 금액은 0원보다 커야 합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('최종 금액은 음수일 수 없습니다')) {
        throw new BadRequestException(error.message);
      }
      
      // 기타 예외는 그대로 전파
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || '주문 생성 중 오류가 발생했습니다.');
    }
  }
} 