import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({ status: 200, description: '상품 목록 조회 성공', type: [ProductResponseDto] })
  async getProducts() {
    return [
      {
        id: 1,
        name: '커피',
        price: 3000,
        stock: 100,
        category: '음료'
      },
      {
        id: 2,
        name: '라떼',
        price: 4000,
        stock: 80,
        category: '음료'
      }
    ];
  }

  @Get('top-sellers')
  @ApiOperation({ summary: '인기 판매 상품 조회' })
  @ApiResponse({ status: 200, description: '인기 판매 상품 조회 성공' })
  async getTopSellers() {
    return [
      {
        id: 1,
        name: '커피',
        price: 3000,
        salesCount: 150,
        totalRevenue: 450000
      },
      {
        id: 2,
        name: '라떼',
        price: 4000,
        salesCount: 120,
        totalRevenue: 480000
      }
    ];
  }
} 