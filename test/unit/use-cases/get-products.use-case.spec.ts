import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from '../../../src/application/use-cases/products/get-products.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { Product } from '../../../src/domain/entities/product.entity';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    mockProductsService = {
      getProducts: jest.fn(),
      getTopSellers: jest.fn(),
      validateAndReserveProducts: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockRedisService = {
      set: jest.fn(),
      eval: jest.fn(),
      pttl: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
      decr: jest.fn(),
      incr: jest.fn(),
      getTopSellersCache: jest.fn(),
      setTopSellersCache: jest.fn(),
      incrementProductSales: jest.fn(),
      getProductSales: jest.fn(),
      getAllProductSales: jest.fn(),
      setProductCache: jest.fn(),
      getProductCache: jest.fn(),
      setProductsCache: jest.fn(),
      getProductsCache: jest.fn(),
      setProductsByCategoryCache: jest.fn(),
      getProductsByCategoryCache: jest.fn(),
      setUserPointsCache: jest.fn(),
      getUserPointsCache: jest.fn(),
      invalidateProductCache: jest.fn(),
      invalidateProductsCache: jest.fn(),
      invalidateTopSellersCache: jest.fn(),
      invalidateUserPointsCache: jest.fn(),
      setWithTTL: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {
          provide: PRODUCTS_SERVICE,
          useValue: mockProductsService,
        },
        {
          provide: REDIS_SERVICE,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
  });

  describe('execute', () => {
    it('상품 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, 'Product 1', 10000, 50, 'Electronics'),
        new Product(2, 'Product 2', 15000, 30, 'Clothing'),
      ];

      // Redis 캐시에서 조회 실패 시뮬레이션
      mockRedisService.getProductsCache.mockResolvedValue(null);
      mockProductsService.getProducts.mockResolvedValue(mockProducts);
      mockRedisService.setProductsCache.mockResolvedValue();

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Product 1');
      expect(result[0].price).toBe(10000);
      expect(result[0].stock).toBe(50);
      expect(result[0].category).toBe('Electronics');
      expect(result[1].id).toBe(2);
      expect(result[1].name).toBe('Product 2');
      expect(result[1].price).toBe(15000);
      expect(result[1].stock).toBe(30);
      expect(result[1].category).toBe('Clothing');
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
      expect(mockRedisService.getProductsCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setProductsCache).toHaveBeenCalledWith(mockProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category
      })), 600);
    });

    it('Redis 캐시에서 상품 목록을 조회해야 한다', async () => {
      // Arrange
      const cachedProducts = [
        { id: 1, name: 'Cached Product 1', price: 10000, stock: 50, category: 'Electronics' },
        { id: 2, name: 'Cached Product 2', price: 15000, stock: 30, category: 'Clothing' },
      ];

      mockRedisService.getProductsCache.mockResolvedValue(cachedProducts);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(cachedProducts);
      expect(mockRedisService.getProductsCache).toHaveBeenCalledTimes(1);
      expect(mockProductsService.getProducts).not.toHaveBeenCalled();
      expect(mockRedisService.setProductsCache).not.toHaveBeenCalled();
    });

    it('빈 상품 목록을 반환해야 한다', async () => {
      // Arrange
      mockRedisService.getProductsCache.mockResolvedValue(null);
      mockProductsService.getProducts.mockResolvedValue([]);
      mockRedisService.setProductsCache.mockResolvedValue();

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setProductsCache).toHaveBeenCalledWith([], 600);
    });

    it('Redis 캐시 조회 실패 시 DB에서 조회해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, 'Product 1', 10000, 50, 'Electronics'),
      ];

      // Redis 캐시 조회 실패 시뮬레이션
      mockRedisService.getProductsCache.mockRejectedValue(new Error('Redis 연결 실패'));
      mockProductsService.getProducts.mockResolvedValue(mockProducts);
      mockRedisService.setProductsCache.mockResolvedValue();

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setProductsCache).toHaveBeenCalledWith(mockProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category
      })), 600);
    });

    it('서비스에서 오류가 발생하면 예외를 던져야 한다', async () => {
      // Arrange
      const errorMessage = '상품 목록을 조회할 수 없습니다.';
      mockRedisService.getProductsCache.mockResolvedValue(null);
      mockProductsService.getProducts.mockRejectedValue(new Error('DB 연결 실패'));

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(errorMessage);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });
  });
}); 