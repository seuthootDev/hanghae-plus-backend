import { ApiProperty } from '@nestjs/swagger';

export class TopSellerResponseDto {
  @ApiProperty({
    description: '상품 ID',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: '상품명',
    example: '커피'
  })
  name: string;

  @ApiProperty({
    description: '상품 가격',
    example: 3000
  })
  price: number;

  @ApiProperty({
    description: '판매 수량',
    example: 150
  })
  salesCount: number;

  @ApiProperty({
    description: '총 매출액',
    example: 450000
  })
  totalRevenue: number;
} 