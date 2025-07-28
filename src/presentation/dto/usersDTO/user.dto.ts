import { ApiProperty } from '@nestjs/swagger';

export class ChargePointDto {
  @ApiProperty({
    description: '충전할 포인트 금액',
    example: 10000,
    minimum: 1000,
    maximum: 1000000
  })
  amount: number;
}

export class UserResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동'
  })
  name: string;

  @ApiProperty({
    description: '보유 포인트',
    example: 50000
  })
  point: number;
}

export class PointResponseDto {
  @ApiProperty({
    description: '현재 포인트',
    example: 50000
  })
  point: number;
} 