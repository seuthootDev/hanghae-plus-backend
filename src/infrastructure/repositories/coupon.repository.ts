import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponRepositoryInterface } from '../../application/interfaces/repositories/coupon-repository.interface';
import { CouponEntity } from './typeorm/coupon.entity';
import { DbPessimisticLock } from '../../common/decorators/db-pessimistic-lock.decorator';

@Injectable()
export class CouponRepository implements CouponRepositoryInterface {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>
  ) {}

  async findById(id: number): Promise<Coupon | null> {
    const couponEntity = await this.couponRepository.findOne({ where: { id } });
    if (!couponEntity) {
      return null;
    }
    
    return new Coupon(
      couponEntity.id,
      couponEntity.userId,
      couponEntity.couponType,
      couponEntity.discountRate,
      couponEntity.discountAmount,
      couponEntity.expiryDate,
      couponEntity.isUsed
    );
  }

  @DbPessimisticLock({
    table: 'coupons',
    column: 'id',
    value: (args: any[]) => args[0].id?.toString() || '0',
    lockMode: 'FOR UPDATE',
    errorMessage: '쿠폰 발급이 다른 사용자에 의해 진행 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async save(coupon: Coupon): Promise<Coupon> {
    let couponEntity: CouponEntity;
    
    if (coupon.id) {
      // 기존 쿠폰 업데이트
      couponEntity = await this.couponRepository.findOne({ where: { id: coupon.id } });
      if (!couponEntity) {
        throw new Error('쿠폰을 찾을 수 없습니다.');
      }
      couponEntity.userId = coupon.userId;
      couponEntity.couponType = coupon.couponType;
      couponEntity.discountRate = coupon.discountRate;
      couponEntity.discountAmount = coupon.discountAmount;
      couponEntity.expiryDate = coupon.expiryDate;
      couponEntity.isUsed = coupon.isUsed;
    } else {
      // 새 쿠폰 생성
      couponEntity = this.couponRepository.create({
        userId: coupon.userId,
        couponType: coupon.couponType,
        discountRate: coupon.discountRate,
        discountAmount: coupon.discountAmount,
        expiryDate: coupon.expiryDate,
        isUsed: coupon.isUsed
      });
    }
    
    const savedEntity = await this.couponRepository.save(couponEntity);
    
    return new Coupon(
      savedEntity.id,
      savedEntity.userId,
      savedEntity.couponType,
      savedEntity.discountRate,
      savedEntity.discountAmount,
      savedEntity.expiryDate,
      savedEntity.isUsed
    );
  }

  async findByUserId(userId: number): Promise<Coupon[]> {
    const couponEntities = await this.couponRepository.find({ where: { userId } });
    
    return couponEntities.map(entity => new Coupon(
      entity.id,
      entity.userId,
      entity.couponType,
      entity.discountRate,
      entity.discountAmount,
      entity.expiryDate,
      entity.isUsed
    ));
  }

  async findByType(couponType: string): Promise<Coupon[]> {
    const couponEntities = await this.couponRepository.find({ where: { couponType } });
    
    return couponEntities.map(entity => new Coupon(
      entity.id,
      entity.userId,
      entity.couponType,
      entity.discountRate,
      entity.discountAmount,
      entity.expiryDate,
      entity.isUsed
    ));
  }
} 