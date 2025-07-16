import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class ChargePointsDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '충전할 금액', example: 10000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1000)
  @Max(1000000)
  amount: number;
}

export class PointsResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '포인트 잔액', example: 15000 })
  amount: number;
} 