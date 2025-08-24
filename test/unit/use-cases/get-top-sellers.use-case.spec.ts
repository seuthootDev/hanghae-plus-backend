import { Test, TestingModule } from '@nestjs/testing';
import { GetTopSellersUseCase } from '../../../src/application/use-cases/products/get-top-sellers.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { TopSellerResponseDto } from '../../../src/presentation/dto/productsDTO/top-seller-response.dto';
import { Product } from '../../../src/domain/entities/product.entity';
import { createMockRedisService } from '../../helpers/redis-mock.helper';

describe('GetTopSellersUseCase', () => {
  let useCase: GetTopSellersUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    const mockProductsServiceProvider = {
      provide: PRODUCTS_SERVICE,
      useValue: {
        getProducts: jest.fn(),
        getTopSellers: jest.fn(),
        validateAndReserveProducts: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockRedisServiceProvider = {
      provide: REDIS_SERVICE,
      useValue: createMockRedisService(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTopSellersUseCase,
        mockProductsServiceProvider,
        mockRedisServiceProvider,
      ],
    }).compile();

    useCase = module.get<GetTopSellersUseCase>(GetTopSellersUseCase);
    mockProductsService = module.get(PRODUCTS_SERVICE);
    mockRedisService = module.get(REDIS_SERVICE);
  });

  describe('execute', () => {
    it('Redis Sorted Set에서 인기 상품을 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, '아메리카노', 3000, 100, '음료'),
        new Product(2, '카페라떼', 4000, 80, '음료'),
        new Product(3, '카푸치노', 4500, 60, '음료'),
      ];

      const expectedResult = [
        { id: 3, name: '카푸치노', price: 4500 },
        { id: 2, name: '카페라떼', price: 4000 },
        { id: 1, name: '아메리카노', price: 3000 },
      ];

      // Redis Sorted Set에서 상위 상품 ID들 반환 (점수 내림차순)
      mockRedisService.zrange.mockResolvedValue(['3', '30', '2', '20', '1', '10']); // [productId, score] 순
      mockProductsService.getProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockRedisService.zrange).toHaveBeenCalledWith('product:ranking:3d', 0, -1, 'WITHSCORES');
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });

    it('Redis Sorted Set에 데이터가 없으면 빈 배열을 반환해야 한다', async () => {
      // Arrange
      mockRedisService.zrange.mockResolvedValue([]);
      
      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockRedisService.zrange).toHaveBeenCalledWith('product:ranking:3d', 0, -1, 'WITHSCORES');
      expect(mockProductsService.getProducts).not.toHaveBeenCalled();
    });

    it('상품 정보를 찾을 수 없는 경우 해당 상품을 제외하고 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, '아메리카노', 3000, 100, '음료'),
        // 상품 2는 없음
        new Product(3, '카푸치노', 4500, 60, '음료'),
      ];

      const expectedResult = [
        { id: 3, name: '카푸치노', price: 4500 },
        { id: 1, name: '아메리카노', price: 3000 },
      ];

      // Redis Sorted Set에서 상위 상품 ID들 반환 
      mockRedisService.zrange.mockResolvedValue(['3', '30', '2', '20', '1', '10']); // 상품 2는 DB에 없음
      mockProductsService.getProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('에러 발생 시 빈 배열을 반환해야 한다', async () => {
      // Arrange
      mockRedisService.zrange.mockRejectedValue(new Error('Redis connection failed'));
      
      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });
  });
}); 