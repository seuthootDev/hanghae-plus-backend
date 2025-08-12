import { Test, TestingModule } from '@nestjs/testing';
import { GetTopSellersUseCase } from '../../../src/application/use-cases/products/get-top-sellers.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { ProductSalesAggregationRepositoryInterface } from '../../../src/application/interfaces/repositories/product-sales-aggregation-repository.interface';
import { TopSellerResponseDto } from '../../../src/presentation/dto/productsDTO/top-seller-response.dto';
import { Product } from '../../../src/domain/entities/product.entity';
import { ProductSalesAggregation } from '../../../src/domain/entities/product-sales-aggregation.entity';

describe('GetTopSellersUseCase', () => {
  let useCase: GetTopSellersUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;
  let mockAggregationRepository: jest.Mocked<ProductSalesAggregationRepositoryInterface>;

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
      useValue: {
        set: jest.fn(),
        eval: jest.fn(),
        pttl: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
        getTopSellersCache: jest.fn(),
        setTopSellersCache: jest.fn(),
        incrementProductSales: jest.fn(),
        getProductSales: jest.fn(),
        getAllProductSales: jest.fn(),
        onModuleDestroy: jest.fn(),
      },
    };

    const mockAggregationRepositoryProvider = {
      provide: 'PRODUCT_SALES_AGGREGATION_REPOSITORY',
      useValue: {
        findByProductId: jest.fn(),
        findTopSellers: jest.fn(),
        save: jest.fn(),
        updateSales: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTopSellersUseCase,
        mockProductsServiceProvider,
        mockRedisServiceProvider,
        mockAggregationRepositoryProvider,
      ],
    }).compile();

    useCase = module.get<GetTopSellersUseCase>(GetTopSellersUseCase);
    mockProductsService = module.get(PRODUCTS_SERVICE);
    mockRedisService = module.get(REDIS_SERVICE);
    mockAggregationRepository = module.get('PRODUCT_SALES_AGGREGATION_REPOSITORY');
  });

  describe('execute', () => {
    it('Redis 캐시에서 인기 상품을 반환해야 한다', async () => {
      // Arrange
      const cachedProducts = [
        { id: 1, name: '아메리카노', price: 3000 },
        { id: 2, name: '카페라떼', price: 4000 },
      ];

      (mockRedisService.getTopSellersCache as jest.Mock).mockResolvedValue(cachedProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(cachedProducts);
      expect(mockRedisService.getTopSellersCache).toHaveBeenCalledTimes(1);
      expect(mockAggregationRepository.findTopSellers).not.toHaveBeenCalled();
    });

    it('캐시가 없으면 집계 테이블에서 조회하고 캐시에 저장해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, '아메리카노', 3000, 100, '음료'),
        new Product(2, '카페라떼', 4000, 80, '음료'),
      ];

      const mockAggregations = [
        new ProductSalesAggregation(1, 2, 60, 240000, new Date()),
        new ProductSalesAggregation(2, 1, 50, 150000, new Date()),
      ];

      const expectedResult = [
        { id: 2, name: '카페라떼', price: 4000 },
        { id: 1, name: '아메리카노', price: 3000 },
      ];

      (mockRedisService.getTopSellersCache as jest.Mock).mockResolvedValue(null);
      mockAggregationRepository.findTopSellers.mockResolvedValue(mockAggregations);
      mockProductsService.getProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockRedisService.getTopSellersCache).toHaveBeenCalledTimes(1);
      expect(mockAggregationRepository.findTopSellers).toHaveBeenCalledWith(5);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setTopSellersCache).toHaveBeenCalledWith(expectedResult);
    });

    it('집계 데이터가 없으면 빈 배열을 반환해야 한다', async () => {
      // Arrange
      (mockRedisService.getTopSellersCache as jest.Mock).mockResolvedValue(null);
      mockAggregationRepository.findTopSellers.mockResolvedValue([]);
      mockProductsService.getProducts.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockRedisService.setTopSellersCache).toHaveBeenCalledWith([]);
    });
  });
}); 