import { ApiProperty } from '@nestjs/swagger';

export class PointsResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  userId: number;

  @ApiProperty({
    description: '포인트 잔액',
    example: 15000
  })
  balance: number;
} 