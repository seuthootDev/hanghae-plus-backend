import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentRepositoryInterface } from '../../application/interfaces/repositories/payment-repository.interface';
import { PaymentEntity } from './typeorm/payment.entity';
import { DbOptimisticLock } from '../../common/decorators/db-optimistic-lock.decorator';

@Injectable()
export class PaymentRepository implements PaymentRepositoryInterface {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>
  ) {}

  @DbOptimisticLock({
    table: 'payments',
    column: 'id',
    value: (args: any[]) => args[0].toString(),
    versionColumn: 'version',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '결제 정보가 다른 사용자에 의해 수정되었습니다. 다시 시도해주세요.'
  })
  async findById(id: number): Promise<Payment | null> {
    const paymentEntity = await this.paymentRepository.findOne({ where: { id } });
    if (!paymentEntity) {
      return null;
    }
    
    return new Payment(
      paymentEntity.id,
      paymentEntity.orderId,
      paymentEntity.userId,
      paymentEntity.totalAmount,
      paymentEntity.discountAmount,
      paymentEntity.finalAmount,
      paymentEntity.couponUsed,
      paymentEntity.status,
      paymentEntity.paidAt
    );
  }

  @DbOptimisticLock({
    table: 'payments',
    column: 'id',
    value: (args: any[]) => args[0].id?.toString() || '0',
    versionColumn: 'version',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '결제 정보가 다른 사용자에 의해 수정되었습니다. 다시 시도해주세요.'
  })
  async save(payment: Payment): Promise<Payment> {
    let paymentEntity: PaymentEntity;
    
    if (payment.id) {
      // 기존 결제 업데이트
      paymentEntity = await this.paymentRepository.findOne({ where: { id: payment.id } });
      if (!paymentEntity) {
        throw new Error('결제를 찾을 수 없습니다.');
      }
      paymentEntity.orderId = payment.orderId;
      paymentEntity.userId = payment.userId;
      paymentEntity.totalAmount = payment.totalAmount;
      paymentEntity.discountAmount = payment.discountAmount;
      paymentEntity.finalAmount = payment.finalAmount;
      paymentEntity.couponUsed = payment.couponUsed;
      paymentEntity.status = payment.status;
      paymentEntity.paidAt = payment.paidAt;
    } else {
      // 새 결제 생성
      paymentEntity = this.paymentRepository.create({
        orderId: payment.orderId,
        userId: payment.userId,
        totalAmount: payment.totalAmount,
        discountAmount: payment.discountAmount,
        finalAmount: payment.finalAmount,
        couponUsed: payment.couponUsed,
        status: payment.status,
        paidAt: payment.paidAt
      });
    }
    
    const savedEntity = await this.paymentRepository.save(paymentEntity);
    
    return new Payment(
      savedEntity.id,
      savedEntity.orderId,
      savedEntity.userId,
      savedEntity.totalAmount,
      savedEntity.discountAmount,
      savedEntity.finalAmount,
      savedEntity.couponUsed,
      savedEntity.status,
      savedEntity.paidAt
    );
  }

  async findByOrderId(orderId: number): Promise<Payment[]> {
    const paymentEntities = await this.paymentRepository.find({ where: { orderId } });
    
    return paymentEntities.map(entity => new Payment(
      entity.id,
      entity.orderId,
      entity.userId,
      entity.totalAmount,
      entity.discountAmount,
      entity.finalAmount,
      entity.couponUsed,
      entity.status,
      entity.paidAt
    ));
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    const paymentEntities = await this.paymentRepository.find({ where: { userId } });
    
    return paymentEntities.map(entity => new Payment(
      entity.id,
      entity.orderId,
      entity.userId,
      entity.totalAmount,
      entity.discountAmount,
      entity.finalAmount,
      entity.couponUsed,
      entity.status,
      entity.paidAt
    ));
  }
} 