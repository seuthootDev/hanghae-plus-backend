import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../../src/application/interfaces/services/orders-service.interface';
import { ProductRepositoryInterface, PRODUCT_REPOSITORY } from '../../../src/application/interfaces/repositories/product-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../../src/application/interfaces/repositories/coupon-repository.interface';
import { OrderValidationService } from '../../../src/domain/services/order-validation.service';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { CreateOrderDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../src/presentation/dto/ordersDTO/order-response.dto';
import { Product } from '../../../src/domain/entities/product.entity';
import { User } from '../../../src/domain/entities/user.entity';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { Order } from '../../../src/domain/entities/order.entity';
import { RedisService } from '../../../src/infrastructure/services/redis.service';
import { ProductSalesAggregationRepositoryInterface } from '../../../src/application/interfaces/repositories/product-sales-aggregation-repository.interface';
import { TRANSACTIONAL_KEY } from '../../../src/common/decorators/transactional.decorator';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrdersService: jest.Mocked<OrdersServiceInterface>;
  let mockProductRepository: jest.Mocked<ProductRepositoryInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockCouponRepository: jest.Mocked<CouponRepositoryInterface>;
  let mockOrderValidationService: jest.Mocked<OrderValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;
  let mockRedisService: Partial<RedisService>;
  let mockAggregationRepository: jest.Mocked<ProductSalesAggregationRepositoryInterface>;

  beforeEach(async () => {
    const mockOrdersServiceProvider = {
      provide: ORDERS_SERVICE,
      useValue: {
        createOrder: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockProductRepositoryProvider = {
      provide: PRODUCT_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockCouponRepositoryProvider = {
      provide: COUPON_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockOrderValidationServiceProvider = {
      provide: OrderValidationService,
      useValue: {
        validateOrderItems: jest.fn(),
        validateProduct: jest.fn(),
        validateOrder: jest.fn(),
      },
    };

    const mockUserValidationServiceProvider = {
      provide: UserValidationService,
      useValue: {
        validateUserExists: jest.fn(),
      },
    };

    mockRedisService = {
      getTopSellersCache: jest.fn(),
      setTopSellersCache: jest.fn(),
      incrementProductSales: jest.fn(),
      getProductSales: jest.fn(),
      getAllProductSales: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    mockAggregationRepository = {
      findByProductId: jest.fn(),
      findTopSellers: jest.fn(),
      save: jest.fn(),
      updateSales: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        mockOrdersServiceProvider,
        mockProductRepositoryProvider,
        mockCouponRepositoryProvider,
        mockUserRepositoryProvider,
        mockOrderValidationServiceProvider,
        mockUserValidationServiceProvider,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: 'PRODUCT_SALES_AGGREGATION_REPOSITORY',
          useValue: mockAggregationRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    mockOrdersService = module.get('ORDERS_SERVICE');
    mockProductRepository = module.get('PRODUCT_REPOSITORY');
    mockCouponRepository = module.get('COUPON_REPOSITORY');
    mockUserRepository = module.get('USER_REPOSITORY');
    mockOrderValidationService = module.get(OrderValidationService);
    mockUserValidationService = module.get(UserValidationService);
  });

  describe('execute', () => {
    it('주문 생성이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 }
      ];
      createOrderDto.couponId = 1;

      const mockProduct1 = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct1.decreaseStock = jest.fn();
      const mockProduct2 = new Product(2, '상품2', 15000, 5, '설명2');
      mockProduct2.decreaseStock = jest.fn();
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10', 10, 0, new Date(), false);
      mockCoupon.isValid = jest.fn().mockReturnValue(true);
      mockCoupon.calculateDiscount = jest.fn().mockReturnValue(3500);

      mockProductRepository.findById
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCouponRepository.findById.mockResolvedValue(mockCoupon);

      const mockOrderItems = [
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 15000 }
      ];
      const mockOrder = new Order(1, userId, mockOrderItems, 35000, 3500, 31500, 1, true, 'PENDING');
      const mockResponseDto = new OrderResponseDto();
      mockResponseDto.orderId = 1;
      mockResponseDto.userId = userId;
      mockResponseDto.totalAmount = 35000;
      mockResponseDto.finalAmount = 31500;

      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockOrderValidationService.validateOrderItems).toHaveBeenCalledWith(createOrderDto.items);
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockCouponRepository.findById).toHaveBeenCalledWith(createOrderDto.couponId);
      expect(mockOrderValidationService.validateOrder).toHaveBeenCalled();
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith({
        userId,
        orderItems: mockOrderItems,
        totalAmount: 35000,
        discountAmount: 3500,
        finalAmount: 31500,
        couponId: 1,
        couponUsed: true
      });
      
      // 재고 차감 검증
      expect(mockProduct1.decreaseStock).toHaveBeenCalledWith(2);
      expect(mockProduct2.decreaseStock).toHaveBeenCalledWith(1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct2);

      // Redis + 집계 테이블 업데이트 검증
      expect(mockRedisService.incrementProductSales).toHaveBeenCalledWith(1, 2);
      expect(mockRedisService.incrementProductSales).toHaveBeenCalledWith(2, 1);
      expect(mockAggregationRepository.updateSales).toHaveBeenCalledWith(1, 0, 0);
      expect(mockAggregationRepository.updateSales).toHaveBeenCalledWith(2, 0, 0);
    });

    it('할인이 없는 주문도 처리해야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];
      createOrderDto.couponId = null;

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn();
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const mockOrderItems = [
        { productId: 1, quantity: 1, price: 10000 }
      ];
      const mockOrder = new Order(1, userId, mockOrderItems, 10000, 0, 10000, null, false, 'PENDING');

      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockCouponRepository.findById).not.toHaveBeenCalled();
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith({
        userId,
        orderItems: mockOrderItems,
        totalAmount: 10000,
        discountAmount: 0,
        finalAmount: 10000,
        couponId: null,
        couponUsed: false
      });
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn();
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockOrdersService.createOrder.mockRejectedValue(new Error('주문 생성 실패'));

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('주문 생성 실패');
    });

    it('재고 부족 에러도 처리해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 15 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn().mockImplementation(() => {
        throw new Error('재고가 부족합니다.');
      });

      mockProductRepository.findById.mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('재고가 부족합니다.');
    });
  });

  describe('execute - 트랜잭션 동작 테스트', () => {
    it('@Transactional 데코레이터가 적용되어야 한다', () => {
      // Arrange & Act
      const metadata = Reflect.getMetadata(TRANSACTIONAL_KEY, useCase.execute);

      // Assert
      expect(metadata).toBeDefined();
    });

    it('상품 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      mockProductRepository.findById.mockRejectedValue(new Error('상품 조회 실패'));

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('상품 조회 실패');
    });

    it('사용자 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn();

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockRejectedValue(new Error('사용자 조회 실패'));

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('사용자 조회 실패');
    });

    it('주문 생성 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn();
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockOrdersService.createOrder.mockRejectedValue(new Error('주문 생성 실패'));

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('주문 생성 실패');
    });

    it('모든 단계가 성공하면 트랜잭션이 커밋되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.decreaseStock = jest.fn();
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 1, price: 10000 }], 10000, 0, 10000, null, false, 'PENDING');

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(result).toBeDefined();
      expect(mockProduct.decreaseStock).toHaveBeenCalledWith(1);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(mockOrdersService.createOrder).toHaveBeenCalled();
    });
  });
}); 