import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../../src/infrastructure/services/product.service';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../../src/application/interfaces/repositories/product-repository.interface';
import { ProductValidationService } from '../../../src/domain/services/product-validation.service';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { Product } from '../../../src/domain/entities/product.entity';
import { createMockRedisService } from '../../helpers/redis-mock.helper';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepository: jest.Mocked<ProductRepositoryInterface>;
  let mockProductValidationService: jest.Mocked<ProductValidationService>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    const mockProductRepositoryProvider = {
      provide: PRODUCT_REPOSITORY,
      useValue: {
        findAll: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockProductValidationServiceProvider = {
      provide: 'PRODUCT_VALIDATION_SERVICE',
      useValue: {
        validateProductExists: jest.fn(),
        validateProductStock: jest.fn(),
      },
    };

    const mockRedisServiceProvider = {
      provide: REDIS_SERVICE,
      useValue: createMockRedisService(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        mockProductRepositoryProvider,
        mockProductValidationServiceProvider,
        mockRedisServiceProvider,
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    mockProductRepository = module.get(PRODUCT_REPOSITORY);
    mockProductValidationService = module.get('PRODUCT_VALIDATION_SERVICE');
    mockRedisService = module.get(REDIS_SERVICE);
  });

  describe('getProducts', () => {
    it('상품 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, '상품1', 10000, 100, '카테고리1'),
        new Product(2, '상품2', 20000, 50, '카테고리2'),
      ];

      mockProductRepository.findAll.mockResolvedValue(mockProducts);
      mockProductValidationService.validateProductExists.mockImplementation(() => {});

      // Act
      const result = await service.getProducts();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(mockProductRepository.findAll).toHaveBeenCalled();
      expect(mockProductValidationService.validateProductExists).toHaveBeenCalledTimes(2);
    });

    it('상품이 없을 때 빈 배열을 반환해야 한다', async () => {
      // Arrange
      mockProductRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getProducts();

      // Assert
      expect(result).toEqual([]);
      expect(mockProductRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('validateAndReserveProducts', () => {
    it('상품 검증 및 예약이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const items = [{ productId: 1, quantity: 2 }];
      const mockProduct = new Product(1, '상품1', 10000, 100, '카테고리1');
      const updatedProduct = new Product(1, '상품1', 10000, 98, '카테고리1');

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);
      mockProductValidationService.validateProductExists.mockImplementation(() => {});
      mockProductValidationService.validateProductStock.mockImplementation(() => {});

      // Act
      const result = await service.validateAndReserveProducts(items);

      // Assert
      expect(result.products).toHaveLength(1);
      expect(result.orderItems).toHaveLength(1);
      expect(result.totalAmount).toBe(20000);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('상품이 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const items = [{ productId: 999, quantity: 1 }];
      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateAndReserveProducts(items)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });
  });

  describe('findById', () => {
    it('상품을 성공적으로 찾아야 한다', async () => {
      // Arrange
      const mockProduct = new Product(1, '상품1', 10000, 100, '카테고리1');
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
    });

    it('상품이 존재하지 않으면 null을 반환해야 한다', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('상품을 성공적으로 저장해야 한다', async () => {
      // Arrange
      const mockProduct = new Product(1, '상품1', 10000, 100, '카테고리1');
      mockProductRepository.save.mockResolvedValue(mockProduct);
      mockRedisService.invalidateProductCache.mockResolvedValue();
      mockRedisService.invalidateProductsCache.mockResolvedValue();

      // Act
      const result = await service.save(mockProduct);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(mockRedisService.invalidateProductCache).toHaveBeenCalledWith(1);
      expect(mockRedisService.invalidateProductsCache).toHaveBeenCalled();
    });

    it('캐시 무효화 실패 시에도 상품 저장은 성공해야 한다', async () => {
      // Arrange
      const mockProduct = new Product(1, '상품1', 10000, 100, '카테고리1');
      mockProductRepository.save.mockResolvedValue(mockProduct);
      mockRedisService.invalidateProductCache.mockRejectedValue(new Error('Redis 연결 실패'));
      mockRedisService.invalidateProductsCache.mockRejectedValue(new Error('Redis 연결 실패'));

      // Act
      const result = await service.save(mockProduct);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
    });
  });
}); 