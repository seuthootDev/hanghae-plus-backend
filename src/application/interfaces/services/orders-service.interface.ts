import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { Order } from '../../../domain/entities/order.entity';

export const ORDERS_SERVICE = 'ORDERS_SERVICE';

export interface OrdersServiceInterface {
  createOrder(createOrderDto: CreateOrderDto): Promise<Order>;
} 