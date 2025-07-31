import { Test, TestingModule } from '@nestjs/testing';
import { GetTopSellersUseCase } from '../../../src/application/use-cases/products/get-top-sellers.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/products-service.interface';
import { TopSellerResponseDto } from '../../../src/presentation/dto/productsDTO/top-seller-response.dto';
import { Product } from '../../../src/domain/entities/product.entity';

describe('GetTopSellersUseCase', () => {
  let useCase: GetTopSellersUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;

  beforeEach(async () => {
    const mockProductsServiceProvider = {
      provide: PRODUCTS_SERVICE,
      useValue: {
        getTopSellers: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTopSellersUseCase,
        mockProductsServiceProvider,
      ],
    }).compile();

    useCase = module.get<GetTopSellersUseCase>(GetTopSellersUseCase);
    mockProductsService = module.get(PRODUCTS_SERVICE);
  });

  describe('execute', () => {
    it('인기 상품 목록을 성공적으로 반환해야 한다', async () => {
      // given
      const mockProducts: Product[] = [
        new Product(2, '카페라떼', 4000, 80, '음료', 60, 240000),
        new Product(1, '아메리카노', 3000, 100, '음료', 50, 150000),
        new Product(3, '카푸치노', 4500, 60, '음료', 30, 135000),
      ];
      const expectedResponse: TopSellerResponseDto[] = [
        {
          id: 2,
          name: '카페라떼',
          price: 4000,
          salesCount: 60,
          totalRevenue: 240000,
        },
        {
          id: 1,
          name: '아메리카노',
          price: 3000,
          salesCount: 50,
          totalRevenue: 150000,
        },
        {
          id: 3,
          name: '카푸치노',
          price: 4500,
          salesCount: 30,
          totalRevenue: 135000,
        },
      ];

      mockProductsService.getTopSellers.mockResolvedValue(mockProducts);

      // when
      const result = await useCase.execute();

      // then
      expect(mockProductsService.getTopSellers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(3);
      
      // 판매 수량 순으로 정렬되어 있는지 확인
      expect(result[0].salesCount).toBeGreaterThanOrEqual(result[1].salesCount);
      expect(result[1].salesCount).toBeGreaterThanOrEqual(result[2].salesCount);
    });

    it('인기 상품이 없으면 빈 배열을 반환해야 한다', async () => {
      // given
      const mockProducts: Product[] = [];
      const expectedResponse: TopSellerResponseDto[] = [];

      mockProductsService.getTopSellers.mockResolvedValue(mockProducts);

      // when
      const result = await useCase.execute();

      // then
      expect(mockProductsService.getTopSellers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(0);
    });

    it('단일 인기 상품을 성공적으로 반환해야 한다', async () => {
      // given
      const mockProducts: Product[] = [
        new Product(1, '아메리카노', 3000, 100, '음료', 50, 150000),
      ];
      const expectedResponse: TopSellerResponseDto[] = [
        {
          id: 1,
          name: '아메리카노',
          price: 3000,
          salesCount: 50,
          totalRevenue: 150000,
        },
      ];

      mockProductsService.getTopSellers.mockResolvedValue(mockProducts);

      // when
      const result = await useCase.execute();

      // then
      expect(mockProductsService.getTopSellers).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('아메리카노');
      expect(result[0].salesCount).toBe(50);
    });

    it('서비스에서 예외가 발생하면 예외를 전파해야 한다', async () => {
      // given
      const errorMessage = '데이터베이스 연결 오류';
      
      mockProductsService.getTopSellers.mockRejectedValue(new Error(errorMessage));

      // when & then
      await expect(useCase.execute()).rejects.toThrow(errorMessage);
      expect(mockProductsService.getTopSellers).toHaveBeenCalled();
    });

    it('매출액이 올바르게 계산되어야 한다', async () => {
      // given
      const mockProducts: Product[] = [
        new Product(1, '아메리카노', 3000, 100, '음료', 50, 150000),
        new Product(2, '카페라떼', 4000, 80, '음료', 60, 240000),
      ];
      const expectedResponse: TopSellerResponseDto[] = [
        {
          id: 1,
          name: '아메리카노',
          price: 3000,
          salesCount: 50,
          totalRevenue: 150000,
        },
        {
          id: 2,
          name: '카페라떼',
          price: 4000,
          salesCount: 60,
          totalRevenue: 240000,
        },
      ];

      mockProductsService.getTopSellers.mockResolvedValue(mockProducts);

      // when
      const result = await useCase.execute();

      // then
      expect(result[0].totalRevenue).toBe(150000);
      expect(result[1].totalRevenue).toBe(240000);
      expect(result[0].totalRevenue).toBe(result[0].price * result[0].salesCount);
      expect(result[1].totalRevenue).toBe(result[1].price * result[1].salesCount);
    });
  });
}); 