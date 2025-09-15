import { ApiProperty } from '@nestjs/swagger';

export class CouponIssueStatusDto {
  @ApiProperty({ description: '요청 ID', example: 'uuid-string' })
  requestId: string;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '쿠폰 타입', example: 'DISCOUNT_10PERCENT' })
  couponType: string;

  @ApiProperty({ description: '처리 상태', enum: ['PENDING', 'SUCCESS', 'FAILED'], example: 'PENDING' })
  status: 'PENDING' | 'SUCCESS' | 'FAILED';

  @ApiProperty({ description: '발급된 쿠폰 ID', example: 123, required: false })
  couponId?: number;

  @ApiProperty({ description: '에러 메시지', example: '쿠폰이 소진되었습니다.', required: false })
  errorMessage?: string;

  @ApiProperty({ description: '처리 완료 시간', example: '2024-01-01T00:00:00.000Z', required: false })
  processedAt?: Date;
}