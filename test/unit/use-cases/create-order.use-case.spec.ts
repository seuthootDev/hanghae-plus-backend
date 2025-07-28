import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { OrdersServiceInterface } from '../../../src/application/interfaces/services/orders-service.interface';
import { OrderPresenterInterface } from '../../../src/application/interfaces/presenters/order-presenter.interface';
import { ProductRepositoryInterface } from '../../../src/application/interfaces/repositories/product-repository.interface';
import { CouponRepositoryInterface } from '../../../src/application/interfaces/repositories/coupon-repository.interface';
import { UserRepositoryInterface } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { OrderValidationService } from '../../../src/domain/services/order-validation.service';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { Order } from '../../../src/domain/entities/order.entity';
import { CreateOrderDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../src/presentation/dto/ordersDTO/order-response.dto';
import { Product } from '../../../src/domain/entities/product.entity';
import { User } from '../../../src/domain/entities/user.entity';
import { Coupon } from '../../../src/domain/entities/coupon.entity';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrdersService: jest.Mocked<OrdersServiceInterface>;
  let mockOrderPresenter: jest.Mocked<OrderPresenterInterface>;
  let mockProductRepository: jest.Mocked<ProductRepositoryInterface>;
  let mockCouponRepository: jest.Mocked<CouponRepositoryInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockOrderValidationService: jest.Mocked<OrderValidationService>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;

  beforeEach(async () => {
    const mockOrdersServiceProvider = {
      provide: 'ORDERS_SERVICE',
      useValue: {
        createOrder: jest.fn(),
      },
    };

    const mockOrderPresenterProvider = {
      provide: 'ORDER_PRESENTER',
      useValue: {
        presentOrder: jest.fn(),
      },
    };

    const mockProductRepositoryProvider = {
      provide: 'PRODUCT_REPOSITORY',
      useValue: {
        findById: jest.fn(),
      },
    };

    const mockCouponRepositoryProvider = {
      provide: 'COUPON_REPOSITORY',
      useValue: {
        findById: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: 'USER_REPOSITORY',
      useValue: {
        findById: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        mockOrdersServiceProvider,
        mockOrderPresenterProvider,
        mockProductRepositoryProvider,
        mockCouponRepositoryProvider,
        mockUserRepositoryProvider,
        mockOrderValidationServiceProvider,
        mockUserValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    mockOrdersService = module.get('ORDERS_SERVICE');
    mockOrderPresenter = module.get('ORDER_PRESENTER');
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
      const mockProduct2 = new Product(2, '상품2', 15000, 5, '설명2');
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
      const mockOrder = new Order(1, userId, mockOrderItems, 35000, 3500, 31500, true, 'PENDING');
      const mockResponseDto = new OrderResponseDto();
      mockResponseDto.orderId = 1;
      mockResponseDto.userId = userId;
      mockResponseDto.totalAmount = 35000;
      mockResponseDto.finalAmount = 31500;

      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      mockOrderPresenter.presentOrder.mockReturnValue(mockResponseDto);

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
        couponUsed: true
      });
      expect(mockOrderPresenter.presentOrder).toHaveBeenCalledWith(mockOrder);
      expect(result).toBe(mockResponseDto);
    });

    it('할인이 없는 주문도 처리해야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 10, '설명1');
      const mockUser = new User(1, 'user@test.com', 'password', 50000);

      mockProductRepository.findById.mockResolvedValue(mockProduct);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockCouponRepository.findById.mockResolvedValue(null);

      const mockOrderItems = [
        { productId: 1, quantity: 1, price: 10000 }
      ];
      const mockOrder = new Order(2, userId, mockOrderItems, 10000, 0, 10000, false, 'PENDING');
      const mockResponseDto = new OrderResponseDto();
      mockResponseDto.orderId = 2;
      mockResponseDto.userId = userId;
      mockResponseDto.totalAmount = 10000;
      mockResponseDto.finalAmount = 10000;

      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      mockOrderPresenter.presentOrder.mockReturnValue(mockResponseDto);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith({
        userId,
        orderItems: mockOrderItems,
        totalAmount: 10000,
        discountAmount: 0,
        finalAmount: 10000,
        couponUsed: false
      });
      expect(mockOrderPresenter.presentOrder).toHaveBeenCalledWith(mockOrder);
      expect(result).toBe(mockResponseDto);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [];

      const mockError = new Error('주문 아이템이 없습니다.');
      mockOrderValidationService.validateOrderItems.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow(
        '주문 아이템이 없습니다.'
      );
    });

    it('재고 부족 에러도 처리해야 한다', async () => {
      // Arrange
      const userId = 1;
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = userId;
      createOrderDto.items = [
        { productId: 1, quantity: 1000 }
      ];

      const mockProduct = new Product(1, '상품1', 10000, 5, '설명1');
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const mockError = new Error('재고가 부족합니다.');
      mockOrderValidationService.validateProduct.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow(
        '재고가 부족합니다.'
      );
    });
  });
}); 