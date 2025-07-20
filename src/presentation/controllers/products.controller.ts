import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../application/interfaces/services/products-service.interface';

@ApiTags('Products')
@Controller('products')
export class ProductsController {

  constructor(
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface
  ) {}

  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '상품 목록 조회 성공',
    type: [ProductResponseDto]
  })
  async getProducts(): Promise<ProductResponseDto[]> {
    return this.productsService.getProducts();
  }

  @Get('top-sellers')
  @ApiOperation({ summary: '인기 판매 상품 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '인기 판매 상품 조회 성공',
    type: [TopSellerResponseDto]
  })
  async getTopSellers(): Promise<TopSellerResponseDto[]> {
    return this.productsService.getTopSellers();
  }
} 