import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem } from '../../domain/entities/order.entity';
import { OrderRepositoryInterface } from '../../application/interfaces/repositories/order-repository.interface';
import { OrderEntity } from './typeorm/order.entity';

@Injectable()
export class OrderRepository implements OrderRepositoryInterface {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>
  ) {}

  async findById(id: number): Promise<Order | null> {
    const orderEntity = await this.orderRepository.findOne({ where: { id } });
    if (!orderEntity) {
      return null;
    }
    
    return new Order(
      orderEntity.id,
      orderEntity.userId,
      orderEntity.items,
      orderEntity.totalAmount,
      orderEntity.discountAmount,
      orderEntity.finalAmount,
      orderEntity.couponId,
      orderEntity.couponUsed,
      orderEntity.status
    );
  }

  async save(order: Order): Promise<Order> {
    let orderEntity: OrderEntity;
    
    if (order.id) {
      // 기존 주문 업데이트
      orderEntity = await this.orderRepository.findOne({ where: { id: order.id } });
      if (!orderEntity) {
        throw new Error('주문을 찾을 수 없습니다.');
      }
      orderEntity.items = order.items;
      orderEntity.totalAmount = order.totalAmount;
      orderEntity.discountAmount = order.discountAmount;
      orderEntity.finalAmount = order.finalAmount;
      orderEntity.couponId = order.couponId;
      orderEntity.couponUsed = order.couponUsed;
      orderEntity.status = order.status;
    } else {
      // 새 주문 생성
      orderEntity = this.orderRepository.create({
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        couponId: order.couponId,
        couponUsed: order.couponUsed,
        status: order.status
      });
    }
    
    const savedEntity = await this.orderRepository.save(orderEntity);
    
    return new Order(
      savedEntity.id,
      savedEntity.userId,
      savedEntity.items,
      savedEntity.totalAmount,
      savedEntity.discountAmount,
      savedEntity.finalAmount,
      savedEntity.couponId,
      savedEntity.couponUsed,
      savedEntity.status
    );
  }

  async findByUserId(userId: number): Promise<Order[]> {
    const orderEntities = await this.orderRepository.find({ where: { userId } });
    
    return orderEntities.map(entity => new Order(
      entity.id,
      entity.userId,
      entity.items,
      entity.totalAmount,
      entity.discountAmount,
      entity.finalAmount,
      entity.couponId,
      entity.couponUsed,
      entity.status
    ));
  }
} 