import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface } from '../../../application/interfaces/services/orders-service.interface';

@Injectable()
export class OrdersService implements OrdersServiceInterface {
  
  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Mock 비즈니스 로직: 주문 생성
    const { userId, items, couponId } = createOrderDto;
    
    // items가 없거나 빈 배열인 경우 예외 처리
    if (!items || items.length === 0) {
      throw new BadRequestException('주문 상품이 필요합니다.');
    }
    
    // Mock 상품 데이터
    const mockProducts = {
      1: { id: 1, name: '아메리카노', price: 3000 },
      2: { id: 2, name: '카페라떼', price: 4000 },
      3: { id: 3, name: '치킨샌드위치', price: 8000 }
    };
    
    // 주문 아이템 계산
    const orderItems = items.map(item => {
      // 필수 필드 검증
      if (!item.productId || !item.quantity) {
        throw new BadRequestException('상품 ID와 수량은 필수입니다.');
      }
      
      const product = mockProducts[item.productId];
      if (!product) {
        throw new BadRequestException(`상품 ID ${item.productId}를 찾을 수 없습니다.`);
      }
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      };
    });
    
    // 총 금액 계산
    let totalAmount = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // 쿠폰 할인 계산
    let discountAmount = 0;
    let couponUsed = false;
    
    if (couponId) {
      // Mock 쿠폰 데이터
      const mockCoupons = {
        10: { discountRate: 10, minAmount: 5000 },  // 6000원 주문에 적용되도록 수정
        11: { discountRate: 20, minAmount: 20000 },
        12: { discountAmount: 1000, minAmount: 5000 },
        13: { discountAmount: 2000, minAmount: 10000 }
      };
      
      const coupon = mockCoupons[couponId];
      if (coupon && totalAmount >= coupon.minAmount) {
        if (coupon.discountRate) {
          discountAmount = Math.floor(totalAmount * (coupon.discountRate / 100));
        } else {
          discountAmount = coupon.discountAmount;
        }
        couponUsed = true;
      }
    }
    
    const finalAmount = totalAmount - discountAmount;
    
    return {
      orderId: Math.floor(Math.random() * 1000) + 100, // Mock 주문 ID
      userId,
      items: orderItems,
      totalAmount,
      discountAmount,
      finalAmount,
      couponUsed,
      status: 'PENDING'
    };
  }
} 