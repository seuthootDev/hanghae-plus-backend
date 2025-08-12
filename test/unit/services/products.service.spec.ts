import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../../src/infrastructure/services/product.service';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../../src/application/interfaces/repositories/product-repository.interface';
import { ProductValidationService } from '../../../src/domain/services/product-validation.service';
import { Product } from '../../../src/domain/entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepository: jest.Mocked<ProductRepositoryInterface>;
  let mockProductValidationService: jest.Mocked<ProductValidationService>;

  beforeEach(async () => {
    const mockProductRepositoryProvider = {
      provide: PRODUCT_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        findTopSellers: jest.fn(),
      },
    };

    const mockProductValidationServiceProvider = {
      provide: ProductValidationService,
      useValue: {
        validateProductExists: jest.fn(),
        validateProductStock: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        mockProductRepositoryProvider,
        mockProductValidationServiceProvider,
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    mockProductRepository = module.get('PRODUCT_REPOSITORY');
    mockProductValidationService = module.get(ProductValidationService);
  });

  describe('getProducts', () => {
    it('상품 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, 'Product 1', 10000, 50, 'Electronics'),
        new Product(2, 'Product 2', 15000, 30, 'Clothing'),
      ];

      mockProductRepository.findAll.mockResolvedValue(mockProducts);

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
    });
  });

  describe('validateAndReserveProducts', () => {
    it('상품 검증 및 재고 차감이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const items = [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 }
      ];

      const mockProduct1 = new Product(1, 'Product 1', 10000, 10, 'Electronics');
      const mockProduct2 = new Product(2, 'Product 2', 15000, 5, 'Clothing');

      mockProductRepository.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      mockProductRepository.save
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      // Act
      const result = await service.validateAndReserveProducts(items);

      // Assert
      expect(result.products).toEqual([mockProduct1, mockProduct2]);
      expect(result.orderItems).toEqual([
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 15000 }
      ]);
      expect(result.totalAmount).toBe(35000);

      expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(2);
      expect(mockProductValidationService.validateProductExists).toHaveBeenCalledWith(mockProduct1);
      expect(mockProductValidationService.validateProductExists).toHaveBeenCalledWith(mockProduct2);
      expect(mockProductValidationService.validateProductStock).toHaveBeenCalledWith(mockProduct1, 2);
      expect(mockProductValidationService.validateProductStock).toHaveBeenCalledWith(mockProduct2, 1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct2);
    });

    it('상품이 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const items = [{ productId: 999, quantity: 1 }];

      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateAndReserveProducts(items)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });
  });

  describe('getTopSellers', () => {
    it('인기 상품 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, 'Popular Product 1', 10000, 50, 'Electronics'),
        new Product(2, 'Popular Product 2', 15000, 30, 'Clothing'),
      ];

      mockProductRepository.findTopSellers.mockResolvedValue(mockProducts);

      // Act
      const result = await service.getTopSellers();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(mockProductRepository.findTopSellers).toHaveBeenCalled();
      expect(mockProductValidationService.validateProductExists).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('상품을 성공적으로 찾아야 한다', async () => {
      // Arrange
      const mockProduct = new Product(1, 'Product 1', 10000, 50, 'Electronics');
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
      const mockProduct = new Product(1, 'Product 1', 10000, 50, 'Electronics');
      mockProductRepository.save.mockResolvedValue(mockProduct);

      // Act
      const result = await service.save(mockProduct);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
    });
  });
}); 