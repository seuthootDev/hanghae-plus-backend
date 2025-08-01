import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { Order, OrderItem } from '../../../domain/entities/order.entity';

export const ORDERS_SERVICE = 'ORDERS_SERVICE';

export interface OrdersServiceInterface {
  createOrder(orderData: {
    userId: number;
    orderItems: OrderItem[];
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponId: number | null;
    couponUsed: boolean;
  }): Promise<Order>;
  findById(orderId: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
} 