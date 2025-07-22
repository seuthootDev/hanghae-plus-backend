import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface } from '../../application/interfaces/services/orders-service.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../application/interfaces/repositories/order-repository.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../application/interfaces/repositories/product-repository.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../application/interfaces/repositories/coupon-repository.interface';
import { Order, OrderItem } from '../../domain/entities/order.entity';

@Injectable()
export class OrdersService implements OrdersServiceInterface {
  
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepositoryInterface
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const { userId, items, couponId } = createOrderDto;
    
    // items가 없거나 빈 배열인 경우 예외 처리
    if (!items || items.length === 0) {
      throw new BadRequestException('주문 상품이 필요합니다.');
    }
    
    // 상품 조회 및 검증
    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // 필수 필드 검증
      if (!item.productId || !item.quantity) {
        throw new BadRequestException('상품 ID와 수량은 필수입니다.');
      }
      
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new BadRequestException(`상품 ID ${item.productId}를 찾을 수 없습니다.`);
      }
      
      // 재고 확인
      if (!product.hasStock(item.quantity)) {
        throw new BadRequestException(`상품 ${product.name}의 재고가 부족합니다.`);
      }
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
      
      totalAmount += product.price * item.quantity;
    }
    
    // 쿠폰 할인 계산
    let discountAmount = 0;
    let couponUsed = false;
    
    if (couponId) {
      const coupon = await this.couponRepository.findById(couponId);
      if (coupon && coupon.isValid()) {
        discountAmount = coupon.calculateDiscount(totalAmount);
        couponUsed = true;
      }
    }
    
    const finalAmount = totalAmount - discountAmount;
    
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
  }
} 