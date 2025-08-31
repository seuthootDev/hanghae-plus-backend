import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    description: '주문 ID',
    example: 100
  })
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: '결제 방법',
    example: 'CARD'
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: '결제 금액',
    example: 10000
  })
  @IsNumber()
  amount: number;
} 