import { Order } from '../../../domain/entities/order.entity';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';

export const ORDER_PRESENTER = 'ORDER_PRESENTER';

export interface OrderPresenterInterface {
  presentOrder(order: Order): OrderResponseDto;
  presentOrderList(orders: Order[]): OrderResponseDto[];
} 