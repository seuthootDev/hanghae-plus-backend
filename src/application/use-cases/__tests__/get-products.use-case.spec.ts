import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from '../products/get-products.use-case';
import { ProductsServiceInterface } from '../../interfaces/services/products-service.interface';
import { ProductPresenterInterface } from '../../interfaces/presenters/product-presenter.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductResponseDto } from '../../../presentation/dto/productsDTO/product-response.dto';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockProductPresenter: jest.Mocked<ProductPresenterInterface>;

  beforeEach(async () => {
    const mockProductsServiceProvider = {
      provide: 'PRODUCTS_SERVICE',
      useValue: {
        getProducts: jest.fn(),
      },
    };

    const mockProductPresenterProvider = {
      provide: 'PRODUCT_PRESENTER',
      useValue: {
        presentProductList: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        mockProductsServiceProvider,
        mockProductPresenterProvider,
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
    mockProductsService = module.get('PRODUCTS_SERVICE');
    mockProductPresenter = module.get('PRODUCT_PRESENTER');
  });

  describe('execute', () => {
    it('상품 목록 조회가 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const mockProducts = [
        new Product(1, 'Product 1', 10000, 50, 'Electronics', 10, 100000),
        new Product(2, 'Product 2', 15000, 30, 'Clothing', 5, 75000),
      ];
      const mockResponseDtos = [
        { id: 1, name: 'Product 1', price: 10000, stock: 50, category: 'Electronics' },
        { id: 2, name: 'Product 2', price: 15000, stock: 30, category: 'Clothing' },
      ];

      mockProductsService.getProducts.mockResolvedValue(mockProducts);
      mockProductPresenter.presentProductList.mockReturnValue(mockResponseDtos);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockProductsService.getProducts).toHaveBeenCalled();
      expect(mockProductPresenter.presentProductList).toHaveBeenCalledWith(mockProducts);
      expect(result).toBe(mockResponseDtos);
    });

    it('빈 상품 목록도 처리해야 한다', async () => {
      // Arrange
      const mockProducts: Product[] = [];
      const mockResponseDtos: ProductResponseDto[] = [];

      mockProductsService.getProducts.mockResolvedValue(mockProducts);
      mockProductPresenter.presentProductList.mockReturnValue(mockResponseDtos);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockProductsService.getProducts).toHaveBeenCalled();
      expect(mockProductPresenter.presentProductList).toHaveBeenCalledWith(mockProducts);
      expect(result).toEqual([]);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const mockError = new Error('상품 목록을 가져올 수 없습니다.');
      mockProductsService.getProducts.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        '상품 목록을 가져올 수 없습니다.'
      );
    });
  });
}); 