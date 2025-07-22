import { Order } from '../../../domain/entities/order.entity';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface OrderRepositoryInterface {
  findById(id: number): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  findByUserId(userId: number): Promise<Order[]>;
} 