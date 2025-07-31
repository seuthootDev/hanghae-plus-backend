import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { ProductResponseDto } from '../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface } from '../../application/interfaces/services/products-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../application/interfaces/repositories/product-repository.interface';
import { ProductValidationService } from '../../domain/services/product-validation.service';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class ProductsService implements ProductsServiceInterface {
  
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    private readonly productValidationService: ProductValidationService
  ) {}
  
  async getProducts(): Promise<Product[]> {
    try {
      const products = await this.productRepository.findAll();
      
      // 각 상품에 대해 기본 검증
      products.forEach(product => {
        this.productValidationService.validateProductExists(product);
      });
      
      return products;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('상품을 찾을 수 없습니다')) {
        throw new InternalServerErrorException('상품 데이터를 불러올 수 없습니다.');
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }
} 