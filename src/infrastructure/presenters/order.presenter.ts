import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderResponseDto } from '../../presentation/dto/ordersDTO/order-response.dto';
import { OrderPresenterInterface } from '../../application/interfaces/presenters/order-presenter.interface';

@Injectable()
export class OrderPresenter implements OrderPresenterInterface {
  
  presentOrder(order: Order): OrderResponseDto {
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

  presentOrderList(orders: Order[]): OrderResponseDto[] {
    return orders.map(order => this.presentOrder(order));
  }
} 