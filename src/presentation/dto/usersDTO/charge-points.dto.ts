import { IsNumber, Min, Max } from 'class-validator';

export class ChargePointsDto {
  @IsNumber()
  @Min(1000, { message: '최소 충전 금액은 1,000원입니다.' })
  @Max(1000000, { message: '최대 충전 금액은 1,000,000원입니다.' })
  amount: number;
} 