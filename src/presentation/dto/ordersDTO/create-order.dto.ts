import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: '상품 ID',
    example: 1
  })
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: '주문 수량',
    example: 2
  })
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '주문 상품 목록',
    type: [OrderItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: '쿠폰 ID (선택사항)',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  couponId?: number;
} 