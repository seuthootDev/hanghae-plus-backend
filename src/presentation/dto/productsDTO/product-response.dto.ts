import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
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
    description: '재고 수량',
    example: 100
  })
  stock: number;

  @ApiProperty({
    description: '상품 카테고리',
    example: '음료'
  })
  category: string;
} 