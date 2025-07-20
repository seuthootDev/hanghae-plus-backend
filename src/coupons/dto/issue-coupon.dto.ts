import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsEnum } from 'class-validator';

export enum CouponType {
  DISCOUNT_10PERCENT = 'DISCOUNT_10PERCENT',
  DISCOUNT_20PERCENT = 'DISCOUNT_20PERCENT',
  FIXED_1000 = 'FIXED_1000',
  FIXED_2000 = 'FIXED_2000'
}

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