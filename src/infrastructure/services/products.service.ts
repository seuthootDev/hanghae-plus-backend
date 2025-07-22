import { Injectable, Inject } from '@nestjs/common';
import { ProductResponseDto } from '../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface } from '../../application/interfaces/services/products-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../application/interfaces/repositories/product-repository.interface';

@Injectable()
export class ProductsService implements ProductsServiceInterface {
  
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryInterface
  ) {}
  
  async getProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll();
    
    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category
    }));
  }

  async getTopSellers(): Promise<TopSellerResponseDto[]> {
    const topSellers = await this.productRepository.findTopSellers();
    
    return topSellers.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue
    }));
  }
} 