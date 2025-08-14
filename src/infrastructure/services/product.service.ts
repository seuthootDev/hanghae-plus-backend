import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ProductsServiceInterface } from '../../application/interfaces/services/product-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../application/interfaces/repositories/product-repository.interface';
import { ProductValidationService } from '../../domain/services/product-validation.service';
import { Product } from '../../domain/entities/product.entity';
import { RedisServiceInterface, REDIS_SERVICE } from '../../application/interfaces/services/redis-service.interface';

@Injectable()
export class ProductsService implements ProductsServiceInterface {
  
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface,
    @Inject('PRODUCT_VALIDATION_SERVICE')
    private readonly productValidationService: ProductValidationService,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
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

  // 주문에서 사용할 메서드들
  async validateAndReserveProducts(items: { productId: number; quantity: number }[]): Promise<{
    products: Product[];
    orderItems: { productId: number; quantity: number; price: number }[];
    totalAmount: number;
  }> {
    const products: Product[] = [];
    const orderItems: { productId: number; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundException('상품을 찾을 수 없습니다.');
      }

      // 상품 검증
      this.productValidationService.validateProductExists(product);
      this.productValidationService.validateProductStock(product, item.quantity);

      // 재고 차감
      product.decreaseStock(item.quantity);
      await this.productRepository.save(product);

      products.push(product);
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    return { products, orderItems, totalAmount };
  }

  async findById(productId: number): Promise<Product | null> {
    return this.productRepository.findById(productId);
  }

  async save(product: Product): Promise<Product> {
    try {
      const savedProduct = await this.productRepository.save(product);
      
      // 상품 정보 변경 시 관련 캐시 무효화
      try {
        await this.redisService.invalidateProductCache(product.id);
        await this.redisService.invalidateProductsCache();
        console.log(`✅ 상품 ${product.id} 관련 캐시 무효화 완료`);
      } catch (cacheError) {
        console.warn(`⚠️ 캐시 무효화 실패 (상품 ${product.id}):`, cacheError.message);
        // 캐시 무효화 실패해도 상품 저장은 성공
      }
      
      return savedProduct;
    } catch (error) {
      console.error(`❌ 상품 ${product.id} 저장 실패:`, error.message);
      throw new InternalServerErrorException('상품을 저장할 수 없습니다.');
    }
  }

  async getTopSellers(): Promise<Product[]> {
    try {
      const products = await this.productRepository.findTopSellers();
      
      products.forEach(product => {
        this.productValidationService.validateProductExists(product);
      });
      
      return products;
    } catch (error) {
      if (error.message.includes('상품을 찾을 수 없습니다')) {
        throw new InternalServerErrorException('상품 데이터를 불러올 수 없습니다.');
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }
} 