import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({ description: '주문 ID', example: 100 })
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}

export class PaymentResponseDto {
  @ApiProperty({ description: '결제 ID', example: 1 })
  paymentId: number;

  @ApiProperty({ description: '주문 ID', example: 100 })
  orderId: number;

  @ApiProperty({ description: '총 금액', example: 6000 })
  totalAmount: number;

  @ApiProperty({ description: '할인 금액', example: 600 })
  discountAmount: number;

  @ApiProperty({ description: '최종 금액', example: 5400 })
  finalAmount: number;

  @ApiProperty({ description: '쿠폰 사용 여부', example: true })
  couponUsed: boolean;

  @ApiProperty({ description: '결제 상태', example: 'SUCCESS' })
  status: string;

  @ApiProperty({ description: '결제일', example: '2024-01-15T10:30:00Z' })
  paidAt: string;
} 