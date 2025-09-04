import { ApiProperty } from '@nestjs/swagger';

export class AsyncCouponIssueResponseDto {
  @ApiProperty({ description: '요청 ID', example: 'uuid-string' })
  requestId: string;

  @ApiProperty({ description: '응답 메시지', example: '쿠폰 발급 요청이 접수되었습니다.' })
  message: string;

  @ApiProperty({ description: '처리 상태', enum: ['PENDING', 'PROCESSING'], example: 'PENDING' })
  status: 'PENDING' | 'PROCESSING';
}

