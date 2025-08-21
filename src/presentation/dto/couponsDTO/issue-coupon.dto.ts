import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum } from 'class-validator';
import { CouponType } from '../../../domain/entities/coupon.entity';

export class IssueCouponDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '쿠폰 타입',
    enum: CouponType,
    example: 'DISCOUNT_10PERCENT'
  })
  @IsEnum(CouponType)
  couponType: CouponType;
} 