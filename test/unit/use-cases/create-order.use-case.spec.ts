import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { OrdersServiceInterface } from '../../../src/application/interfaces/services/orders-service.interface';
import { OrderPresenterInterface } from '../../../src/application/interfaces/presenters/order-presenter.interface';
import { Order } from '../../../src/domain/entities/order.entity';
import { CreateOrderDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../src/presentation/dto/ordersDTO/order-response.dto';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrdersService: jest.Mocked<OrdersServiceInterface>;
  let mockOrderPresenter: jest.Mocked<OrderPresenterInterface>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        mockOrdersServiceProvider,
        mockOrderPresenterProvider,
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    mockOrdersService = module.get('ORDERS_SERVICE');
    mockOrderPresenter = module.get('ORDER_PRESENTER');
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

      const mockOrderItems = [
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 15000 }
      ];
      const mockOrder = new Order(1, userId, mockOrderItems, 35000, 5000, 30000);
      const mockResponseDto = new OrderResponseDto();
      mockResponseDto.orderId = 1;
      mockResponseDto.userId = userId;
      mockResponseDto.totalAmount = 35000;
      mockResponseDto.finalAmount = 30000;

      mockOrdersService.createOrder.mockResolvedValue(mockOrder);
      mockOrderPresenter.presentOrder.mockReturnValue(mockResponseDto);

      // Act
      const result = await useCase.execute(createOrderDto);

      // Assert
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(createOrderDto);
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

      const mockOrderItems = [
        { productId: 1, quantity: 1, price: 10000 }
      ];
      const mockOrder = new Order(2, userId, mockOrderItems, 10000, 0, 10000);
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
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith(createOrderDto);
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
      mockOrdersService.createOrder.mockRejectedValue(mockError);

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

      const mockError = new Error('재고가 부족합니다.');
      mockOrdersService.createOrder.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(createOrderDto)).rejects.toThrow(
        '재고가 부족합니다.'
      );
    });
  });
}); 