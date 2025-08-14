import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProductDetailUseCase } from '../../../src/application/use-cases/products/get-product-detail.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { Product } from '../../../src/domain/entities/product.entity';

describe('GetProductDetailUseCase', () => {
  let useCase: GetProductDetailUseCase;
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
        GetProductDetailUseCase,
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

    useCase = module.get<GetProductDetailUseCase>(GetProductDetailUseCase);
  });

  describe('execute', () => {
    it('Redis 캐시에서 상품 상세 정보를 조회해야 한다', async () => {
      // Arrange
      const productId = 1;
      const cachedProduct = {
        id: 1,
        name: 'Cached Product',
        price: 10000,
        stock: 50,
        category: 'Electronics'
      };

      mockRedisService.getProductCache.mockResolvedValue(cachedProduct);

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result).toEqual(cachedProduct);
      expect(mockRedisService.getProductCache).toHaveBeenCalledWith(productId);
      expect(mockProductsService.findById).not.toHaveBeenCalled();
      expect(mockRedisService.setProductCache).not.toHaveBeenCalled();
    });

    it('캐시가 없을 때 DB에서 상품을 조회하고 캐시에 저장해야 한다', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = new Product(1, 'Product 1', 10000, 50, 'Electronics');

      mockRedisService.getProductCache.mockResolvedValue(null);
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockRedisService.setProductCache.mockResolvedValue();

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result).toEqual({
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      });
      expect(mockRedisService.getProductCache).toHaveBeenCalledWith(productId);
      expect(mockProductsService.findById).toHaveBeenCalledWith(productId);
      expect(mockRedisService.setProductCache).toHaveBeenCalledWith(productId, {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      }, 600);
    });

    it('상품이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      // Arrange
      const productId = 999;

      mockRedisService.getProductCache.mockResolvedValue(null);
      mockProductsService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(productId)).rejects.toThrow(
        new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`)
      );
      expect(mockRedisService.getProductCache).toHaveBeenCalledWith(productId);
      expect(mockProductsService.findById).toHaveBeenCalledWith(productId);
      expect(mockRedisService.setProductCache).not.toHaveBeenCalled();
    });

    it('Redis 캐시 조회 실패 시 DB에서 조회해야 한다', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = new Product(1, 'Product 1', 10000, 50, 'Electronics');

      // Redis 캐시 조회 실패 시뮬레이션
      mockRedisService.getProductCache.mockRejectedValue(new Error('Redis 연결 실패'));
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockRedisService.setProductCache.mockResolvedValue();

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result).toEqual({
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      });
      expect(mockProductsService.findById).toHaveBeenCalledWith(productId);
      expect(mockRedisService.setProductCache).toHaveBeenCalledWith(productId, {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      }, 600);
    });

    it('Redis 캐시 저장 실패 시에도 결과를 반환해야 한다', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = new Product(1, 'Product 1', 10000, 50, 'Electronics');

      mockRedisService.getProductCache.mockResolvedValue(null);
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockRedisService.setProductCache.mockRejectedValue(new Error('Redis 저장 실패'));

      // Act
      const result = await useCase.execute(productId);

      // Assert
      expect(result).toEqual({
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      });
      expect(mockProductsService.findById).toHaveBeenCalledWith(productId);
      expect(mockRedisService.setProductCache).toHaveBeenCalledWith(productId, {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        stock: mockProduct.stock,
        category: mockProduct.category
      }, 600);
    });

    it('DB 조회 실패 시 적절한 에러를 던져야 한다', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'DB 연결 실패';

      mockRedisService.getProductCache.mockResolvedValue(null);
      mockProductsService.findById.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useCase.execute(productId)).rejects.toThrow('상품을 조회할 수 없습니다.');
      expect(mockRedisService.getProductCache).toHaveBeenCalledWith(productId);
      expect(mockProductsService.findById).toHaveBeenCalledWith(productId);
      expect(mockRedisService.setProductCache).not.toHaveBeenCalled();
    });
  });
});
