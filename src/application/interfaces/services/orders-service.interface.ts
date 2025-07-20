import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';

export const ORDERS_SERVICE = 'ORDERS_SERVICE';

export interface OrdersServiceInterface {
  createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto>;
} 