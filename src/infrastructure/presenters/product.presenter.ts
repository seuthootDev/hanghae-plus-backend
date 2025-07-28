import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductResponseDto } from '../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductPresenterInterface } from '../../application/interfaces/presenters/product-presenter.interface';

@Injectable()
export class ProductPresenter implements ProductPresenterInterface {
  
  presentProduct(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category
    };
  }

  presentProductList(products: Product[]): ProductResponseDto[] {
    return products.map(product => this.presentProduct(product));
  }

  presentTopSeller(product: Product): TopSellerResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue
    };
  }
} 