import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product-response.dto';
import { TopSellerResponseDto } from './dto/top-seller-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {

  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '상품 목록 조회 성공',
    type: [ProductResponseDto]
  })
  async getProducts(): Promise<ProductResponseDto[]> {
    // TODO: 실제 비즈니스 로직 구현
    return [
      {
        id: 1,
        name: '커피',
        price: 3000,
        stock: 100,
        category: '음료'
      }
    ];
  }

  @Get('top-sellers')
  @ApiOperation({ summary: '인기 판매 상품 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '인기 판매 상품 조회 성공',
    type: [TopSellerResponseDto]
  })
  async getTopSellers(): Promise<TopSellerResponseDto[]> {
    // TODO: 실제 비즈니스 로직 구현
    return [
      {
        id: 1,
        name: '커피',
        price: 3000,
        salesCount: 150,
        totalRevenue: 450000
      }
    ];
  }
} 