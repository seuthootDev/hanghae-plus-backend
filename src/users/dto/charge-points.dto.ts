import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty, IsDefined } from 'class-validator';

export class ChargePointsDto {
  @ApiProperty({
    description: '충전할 포인트 금액',
    example: 10000,
    minimum: 1000,
    maximum: 1000000
  })
  @IsDefined()
  @IsNumber()
  @Min(1000)
  @Max(1000000)
  @IsNotEmpty()
  amount: number;
} 