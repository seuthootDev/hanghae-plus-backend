import { ApiProperty } from '@nestjs/swagger';

export class CouponResponseDto {
  @ApiProperty({
    description: '쿠폰 ID',
    example: 10
  })
  couponId: number;

  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  userId: number;

  @ApiProperty({
    description: '쿠폰 타입',
    example: 'DISCOUNT_10PERCENT'
  })
  couponType: string;

  @ApiProperty({
    description: '할인율',
    example: 10
  })
  discountRate: number;

  @ApiProperty({
    description: '만료일',
    example: '2024-12-31'
  })
  expiryDate: string;

  @ApiProperty({
    description: '사용 여부',
    example: false
  })
  isUsed: boolean;
} 