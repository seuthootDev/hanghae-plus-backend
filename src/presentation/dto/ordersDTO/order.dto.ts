import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray, IsOptional, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: '수량', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '주문 상품 목록', type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];

  @ApiProperty({ description: '쿠폰 ID', example: 10, required: false })
  @IsNumber()
  @IsOptional()
  couponId?: number;
}

export class OrderResponseDto {
  @ApiProperty({ description: '주문 ID', example: 100 })
  orderId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '주문 상품 목록', type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ description: '총 금액', example: 6000 })
  totalAmount: number;

  @ApiProperty({ description: '할인 금액', example: 600 })
  discountAmount: number;

  @ApiProperty({ description: '최종 금액', example: 5400 })
  finalAmount: number;

  @ApiProperty({ description: '쿠폰 사용 여부', example: true })
  couponUsed: boolean;

  @ApiProperty({ description: '주문 상태', example: 'PENDING' })
  status: string;

  @ApiProperty({ description: '결제일', example: '2024-01-15T10:30:00Z', required: false })
  paymentDate?: string;
} 