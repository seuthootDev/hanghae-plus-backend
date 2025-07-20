import { Injectable } from '@nestjs/common';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';
import { TopSellerResponseDto } from '../../../presentation/dto/productsDTO/top-seller-response.dto';
import { ProductsServiceInterface } from '../../../application/interfaces/services/products-service.interface';

@Injectable()
export class ProductsService implements ProductsServiceInterface {
  
  async getProducts(): Promise<ProductResponseDto[]> {
    // Mock 비즈니스 로직: 상품 목록 조회
    const mockProducts: ProductResponseDto[] = [
      {
        id: 1,
        name: '아메리카노',
        price: 3000,
        stock: 100,
        category: '음료'
      },
      {
        id: 2,
        name: '카페라떼',
        price: 4000,
        stock: 80,
        category: '음료'
      },
      {
        id: 3,
        name: '치킨샌드위치',
        price: 8000,
        stock: 50,
        category: '식품'
      },
      {
        id: 4,
        name: '에스프레소',
        price: 2000,
        stock: 120,
        category: '음료'
      },
      {
        id: 5,
        name: '티셔츠',
        price: 15000,
        stock: 30,
        category: '의류'
      }
    ];
    
    return mockProducts;
  }

  async getTopSellers(): Promise<TopSellerResponseDto[]> {
    // Mock 비즈니스 로직: 인기 상품 조회 (최근 3일간 판매량 기준)
    const mockTopSellers: TopSellerResponseDto[] = [
      {
        id: 1,
        name: '아메리카노',
        price: 3000,
        salesCount: 150,
        totalRevenue: 450000
      },
      {
        id: 2,
        name: '카페라떼',
        price: 4000,
        salesCount: 120,
        totalRevenue: 480000
      },
      {
        id: 3,
        name: '치킨샌드위치',
        price: 8000,
        salesCount: 80,
        totalRevenue: 640000
      },
      {
        id: 4,
        name: '에스프레소',
        price: 2000,
        salesCount: 200,
        totalRevenue: 400000
      },
      {
        id: 5,
        name: '티셔츠',
        price: 15000,
        salesCount: 25,
        totalRevenue: 375000
      }
    ];
    
    return mockTopSellers;
  }
} 