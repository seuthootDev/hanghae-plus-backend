import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '상품명', example: '커피' })
  name: string;

  @ApiProperty({ description: '가격', example: 3000 })
  price: number;

  @ApiProperty({ description: '재고', example: 100 })
  stock: number;

  @ApiProperty({ description: '카테고리', example: '음료' })
  category: string;
}

export class TopSellerProductDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '상품명', example: '커피' })
  name: string;

  @ApiProperty({ description: '가격', example: 3000 })
  price: number;

  @ApiProperty({ description: '판매 수량', example: 150 })
  salesCount: number;

  @ApiProperty({ description: '총 매출', example: 450000 })
  totalRevenue: number;
} 