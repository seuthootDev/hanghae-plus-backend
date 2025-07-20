import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({
    description: '상품 ID',
    example: 1
  })
  productId: number;

  @ApiProperty({
    description: '주문 수량',
    example: 2
  })
  quantity: number;

  @ApiProperty({
    description: '상품 가격',
    example: 3000
  })
  price: number;
}

export class OrderResponseDto {
  @ApiProperty({
    description: '주문 ID',
    example: 100
  })
  orderId: number;

  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  userId: number;

  @ApiProperty({
    description: '주문 상품 목록',
    type: [OrderItemResponseDto]
  })
  items: OrderItemResponseDto[];

  @ApiProperty({
    description: '총 주문 금액',
    example: 6000
  })
  totalAmount: number;

  @ApiProperty({
    description: '할인 금액',
    example: 600
  })
  discountAmount: number;

  @ApiProperty({
    description: '최종 결제 금액',
    example: 5400
  })
  finalAmount: number;

  @ApiProperty({
    description: '쿠폰 사용 여부',
    example: true
  })
  couponUsed: boolean;

  @ApiProperty({
    description: '주문 상태',
    example: 'PENDING'
  })
  status: string;
} 