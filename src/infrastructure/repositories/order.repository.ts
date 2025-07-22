import { Injectable } from '@nestjs/common';
import { Order, OrderItem } from '../../domain/entities/order.entity';
import { OrderRepositoryInterface } from '../../application/interfaces/repositories/order-repository.interface';

@Injectable()
export class OrderRepository implements OrderRepositoryInterface {
  private orders: Map<number, Order> = new Map();
  private nextOrderId = 100;

  constructor() {
    // Mock 데이터 초기화
    const mockOrderItems: OrderItem[] = [
      { productId: 1, quantity: 2, price: 3000 },
      { productId: 2, quantity: 1, price: 4000 }
    ];

    const order1 = new Order(
      this.nextOrderId++,
      1, // userId
      mockOrderItems,
      10000, // totalAmount
      1000, // discountAmount
      9000, // finalAmount
      true, // couponUsed
      'PENDING' // status
    );

    this.orders.set(order1.id, order1);
  }

  async findById(id: number): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async save(order: Order): Promise<Order> {
    if (!order.id) {
      // 새 주문인 경우 ID 할당
      const newOrder = new Order(
        this.nextOrderId++,
        order.userId,
        order.items,
        order.totalAmount,
        order.discountAmount,
        order.finalAmount,
        order.couponUsed,
        order.status
      );
      this.orders.set(newOrder.id, newOrder);
      return newOrder;
    } else {
      // 기존 주문 업데이트
      this.orders.set(order.id, order);
      return order;
    }
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
} 