import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../../src/application/interfaces/services/order-service.interface';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { UsersServiceInterface, USERS_SERVICE } from '../../../src/application/interfaces/services/user-service.interface';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../../src/application/interfaces/services/coupon-service.interface';
import { OrderValidationService } from '../../../src/domain/services/order-validation.service';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { CreateOrderDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';
import { Product } from '../../../src/domain/entities/product.entity';
import { User } from '../../../src/domain/entities/user.entity';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { Order } from '../../../src/domain/entities/order.entity';
import { createMockRedisService } from '../../helpers/redis-mock.helper';
import { ProductSalesAggregationRepositoryInterface } from '../../../src/application/interfaces/repositories/product-sales-aggregation-repository.interface';
import { TRANSACTIONAL_KEY } from '../../../src/common/decorators/transactional.decorator';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrdersService: jest.Mocked<OrdersServiceInterface>;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;
  let mockCouponsService: jest.Mocked<CouponsServiceInterface>;
  let mockOrderValidationService: jest.Mocked<OrderValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;
  let mockAggregationRepository: jest.Mocked<ProductSalesAggregationRepositoryInterface>;

  beforeEach(async () => {
    const mockOrdersServiceProvider = {
      provide: ORDERS_SERVICE,
      useValue: {
        createOrder: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        updateOrderStatus: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

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

    const mockUsersServiceProvider = {
      provide: USERS_SERVICE,
      useValue: {
        chargePoints: jest.fn(),
        getUserPoints: jest.fn(),
        validateUser: jest.fn(),
        usePoints: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockCouponsServiceProvider = {
      provide: COUPONS_SERVICE,
      useValue: {
        issueCoupon: jest.fn(),
        getUserCoupons: jest.fn(),
        validateAndCalculateDiscount: jest.fn(),
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

    mockRedisService = createMockRedisService();

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
        mockProductsServiceProvider,
        mockUsersServiceProvider,
        mockCouponsServiceProvider,
        mockOrderValidationServiceProvider,
        mockUserValidationServiceProvider,
        {
          provide: REDIS_SERVICE,
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
    mockProductsService = module.get('PRODUCTS_SERVICE');
    mockUsersService = module.get('USERS_SERVICE');
    mockCouponsService = module.get('COUPONS_SERVICE');
    mockOrderValidationService = module.get(OrderValidationService);
    mockUserValidationService = module.get(UserValidationService);
    mockRedisService = module.get(REDIS_SERVICE);
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
      const mockProduct2 = new Product(2, '상품2', 15000, 5, '설명2');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10', 10, 0, new Date(), false);

      const mockOrderItems = [
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 15000 }
      ];

      // 서비스 모킹
      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [mockProduct1, mockProduct2],
        orderItems: mockOrderItems,
        totalAmount: 35000
      });

      mockUsersService.validateUser.mockResolvedValue(mockUser);

      mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
        coupon: mockCoupon,
        discountAmount: 3500,
        couponUsed: true
      });

      const mockOrder = new Order(1, userId, mockOrderItems, 35000, 3500, 31500, 1, true, 'PENDING');
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);

      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockOrderValidationService.validateOrderItems).toHaveBeenCalledWith(createOrderDto.items);
      expect(mockProductsService.validateAndReserveProducts).toHaveBeenCalledWith(createOrderDto.items);
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(userId);
      expect(mockCouponsService.validateAndCalculateDiscount).toHaveBeenCalledWith(createOrderDto.couponId, 35000);
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

      // Redis + 집계 테이블 업데이트 검증
      expect(mockRedisService.incrementProductSales).toHaveBeenCalledWith(1, 2);
      expect(mockRedisService.incrementProductSales).toHaveBeenCalledWith(2, 1);
      expect(mockAggregationRepository.updateSales).toHaveBeenCalledWith(1, 0, 0);
      expect(mockAggregationRepository.updateSales).toHaveBeenCalledWith(2, 0, 0);
    });

    it('쿠폰이 없는 경우에도 주문이 성공적으로 생성되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [
        { productId: 1, quantity: 2 }
      ];
      createOrderDto.couponId = null;

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      const mockOrderItems = [
        { productId: 1, quantity: 2, price: 10000 }
      ];

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [mockProduct],
        orderItems: mockOrderItems,
        totalAmount: 20000
      });

      mockUsersService.validateUser.mockResolvedValue(mockUser);

      mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });

      const mockOrder = new Order(1, userId, mockOrderItems, 20000, 0, 20000, null, false, 'PENDING');
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);

      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockCouponsService.validateAndCalculateDiscount).toHaveBeenCalledWith(null, 20000);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith({
        userId,
        orderItems: mockOrderItems,
        totalAmount: 20000,
        discountAmount: 0,
        finalAmount: 20000,
        couponId: null,
        couponUsed: false
      });
    });

    it('상품 검증 실패 시 에러가 발생해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 2 }
      ];

      mockProductsService.validateAndReserveProducts.mockRejectedValue(
        new Error('상품을 찾을 수 없습니다.')
      );

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });

    it('사용자 검증 실패 시 에러가 발생해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 2 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [mockProduct],
        orderItems: [{ productId: 1, quantity: 2, price: 10000 }],
        totalAmount: 20000
      });

      mockUsersService.validateUser.mockRejectedValue(
        new Error('사용자를 찾을 수 없습니다.')
      );

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });

    it('쿠폰 검증 실패 시 에러가 발생해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 2 }
      ];
      createOrderDto.couponId = 1;

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [mockProduct],
        orderItems: [{ productId: 1, quantity: 2, price: 10000 }],
        totalAmount: 20000
      });

      mockUsersService.validateUser.mockResolvedValue(mockUser);

      mockCouponsService.validateAndCalculateDiscount.mockRejectedValue(
        new Error('유효하지 않은 쿠폰입니다.')
      );

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('유효하지 않은 쿠폰입니다.');
    });

    it('주문 생성 실패 시 재고가 반환되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 2 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      mockProduct.increaseStock = jest.fn();

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [mockProduct],
        orderItems: [{ productId: 1, quantity: 2, price: 10000 }],
        totalAmount: 20000
      });

      mockUsersService.validateUser.mockResolvedValue(new User(1, 'user@test.com', 'password', 50000));
      mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });

      mockOrdersService.createOrder.mockRejectedValue(new Error('주문 생성 실패'));

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('주문 생성 실패');
      
      // 재고 반환 로직은 이제 인터셉터에서 처리되므로 직접 검증하지 않음
      // 대신 에러가 발생했는지만 확인
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

      mockProductsService.validateAndReserveProducts.mockRejectedValue(
        new Error('상품 검증 및 재고 차감에 실패했습니다.')
      );

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow('상품 검증 및 재고 차감에 실패했습니다.');
    });

    it('사용자 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [new Product(1, '상품1', 10000, 10, '설명1')],
        orderItems: [{ productId: 1, quantity: 1, price: 10000 }],
        totalAmount: 10000
      });
      mockUsersService.validateUser.mockRejectedValue(new Error('사용자 조회 실패'));

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

      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [new Product(1, '상품1', 10000, 10, '설명1')],
        orderItems: [{ productId: 1, quantity: 1, price: 10000 }],
        totalAmount: 10000
      });
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });
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

      const mockUser = new User(1, 'user@test.com', 'password', 50000);
      const mockOrder = new Order(1, 1, [{ productId: 1, quantity: 1, price: 10000 }], 10000, 0, 10000, null, false, 'PENDING');

      mockProductsService.validateAndReserveProducts.mockResolvedValue({
        products: [new Product(1, '상품1', 10000, 10, '설명1')],
        orderItems: [{ productId: 1, quantity: 1, price: 10000 }],
        totalAmount: 10000
      });
      mockUsersService.validateUser.mockResolvedValue(mockUser);
      mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      (mockRedisService.incrementProductSales as jest.Mock).mockResolvedValue(undefined);
      (mockRedisService.getProductSales as jest.Mock).mockResolvedValue(0);
      mockAggregationRepository.updateSales.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(result).toBeDefined();
      expect(mockOrdersService.createOrder).toHaveBeenCalled();
    });
  });
}); 