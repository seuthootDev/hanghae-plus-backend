import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from '../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface } from '../../application/interfaces/services/orders-service.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../application/interfaces/repositories/order-repository.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../application/interfaces/repositories/product-repository.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../application/interfaces/repositories/coupon-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { Order, OrderItem } from '../../domain/entities/order.entity';
import { OrderValidationService } from '../../domain/services/order-validation.service';
import { UserValidationService } from '../../domain/services/user-validation.service';

@Injectable()
export class OrdersService implements OrdersServiceInterface {
  
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly orderValidationService: OrderValidationService,
    private readonly userValidationService: UserValidationService
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const { userId, items, couponId } = createOrderDto;
    
    try {
      // 도메인 서비스를 사용한 검증
      this.orderValidationService.validateOrderItems(items);
      
      // 상품 조회
      const products: any[] = [];
      const orderItems: OrderItem[] = [];
      let totalAmount = 0;
      
      for (const item of items) {
        const product = await this.productRepository.findById(item.productId);
        products.push(product);
        
        // 도메인 서비스를 사용한 상품 검증
        this.orderValidationService.validateProduct(product, item.quantity);
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product!.price
        });
        
        totalAmount += product!.price * item.quantity;
      }
      
      // 사용자 조회
      const user = await this.userRepository.findById(userId);
      this.userValidationService.validateUserExists(user);
      
      // 쿠폰 조회 및 할인 계산
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
      
      // 도메인 서비스를 사용한 전체 검증
      this.orderValidationService.validateOrder(
        items,
        products,
        user,
        coupon,
        totalAmount,
        finalAmount
      );
      
      // 주문 생성
      const order = new Order(
        0, // ID는 저장 시 할당
        userId,
        orderItems,
        totalAmount,
        discountAmount,
        finalAmount,
        couponUsed,
        'PENDING'
      );
      
      // 주문 저장
      const savedOrder = await this.orderRepository.save(order);
      
      return {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        items: savedOrder.items,
        totalAmount: savedOrder.totalAmount,
        discountAmount: savedOrder.discountAmount,
        finalAmount: savedOrder.finalAmount,
        couponUsed: savedOrder.couponUsed,
        status: savedOrder.status
      };
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('주문 상품이 필요합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('상품 ID와 수량은 필수입니다')) {
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
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }
} 