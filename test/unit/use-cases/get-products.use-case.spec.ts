import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from '../../../src/application/use-cases/products/get-products.use-case';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { Product } from '../../../src/domain/entities/product.entity';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;

  beforeEach(async () => {
    mockProductsService = {
      getProducts: jest.fn(),
      getTopSellers: jest.fn(),
      validateAndReserveProducts: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {
          provide: PRODUCTS_SERVICE,
          useValue: mockProductsService,
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

      mockProductsService.getProducts.mockResolvedValue(mockProducts);

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
    });

    it('빈 상품 목록을 반환해야 한다', async () => {
      // Arrange
      mockProductsService.getProducts.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });

    it('서비스에서 오류가 발생하면 예외를 던져야 한다', async () => {
      // Arrange
      const errorMessage = '상품 조회 중 오류가 발생했습니다';
      mockProductsService.getProducts.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(errorMessage);
      expect(mockProductsService.getProducts).toHaveBeenCalledTimes(1);
    });
  });
}); 