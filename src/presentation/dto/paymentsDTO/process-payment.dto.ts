import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    description: '주문 ID',
    example: 100
  })
  @IsNumber()
  orderId: number;
} 