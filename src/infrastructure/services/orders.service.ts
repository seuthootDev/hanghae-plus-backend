import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from '../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface } from '../../application/interfaces/services/orders-service.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../application/interfaces/repositories/order-repository.interface';
import { Order, OrderItem } from '../../domain/entities/order.entity';

@Injectable()
export class OrdersService implements OrdersServiceInterface {
  
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface
  ) {}

  async createOrder(orderData: {
    userId: number;
    orderItems: OrderItem[];
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponId: number | null;
    couponUsed: boolean;
  }): Promise<Order> {
    try {
      // 주문 생성
      const order = new Order(
        0, // ID는 저장 시 할당
        orderData.userId,
        orderData.orderItems,
        orderData.totalAmount,
        orderData.discountAmount,
        orderData.finalAmount,
        orderData.couponId,
        orderData.couponUsed,
        'PENDING'
      );
      
      // 주문 저장
      const savedOrder = await this.orderRepository.save(order);
      
      return savedOrder;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('주문 데이터가 유효하지 않습니다')) {
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

  async findById(orderId: number): Promise<Order | null> {
    return this.orderRepository.findById(orderId);
  }

  async save(order: Order): Promise<Order> {
    return this.orderRepository.save(order);
  }
} 