import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../dto/productsDTO/top-seller-response.dto';
import { GetProductsUseCase } from '../../application/use-cases/products/get-products.use-case';
import { GetTopSellersUseCase } from '../../application/use-cases/products/get-top-sellers.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductsController {

  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getTopSellersUseCase: GetTopSellersUseCase
  ) {}

  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '상품 목록 조회 성공',
    type: [ProductResponseDto]
  })
  async getProducts(): Promise<ProductResponseDto[]> {
    return this.getProductsUseCase.execute();
  }

  @Get('top-sellers')
  @ApiOperation({ summary: '인기 판매 상품 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '인기 판매 상품 조회 성공',
    type: [TopSellerResponseDto]
  })
  async getTopSellers(): Promise<TopSellerResponseDto[]> {
    return this.getTopSellersUseCase.execute();
  }
} 