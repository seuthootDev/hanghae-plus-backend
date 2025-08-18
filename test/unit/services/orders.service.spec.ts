import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../../src/infrastructure/services/order.service';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../../src/application/interfaces/repositories/order-repository.interface';
import { Order, OrderItem } from '../../../src/domain/entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrderRepository: jest.Mocked<OrderRepositoryInterface>;

  beforeEach(async () => {
    const mockOrderRepositoryProvider = {
      provide: ORDER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        mockOrderRepositoryProvider,
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    mockOrderRepository = module.get('ORDER_REPOSITORY');
  });

  describe('createOrder', () => {
    it('주문 생성이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const orderData = {
        userId: 1,
        orderItems: [
          { productId: 1, quantity: 2, price: 10000 },
          { productId: 2, quantity: 1, price: 15000 }
        ],
        totalAmount: 35000,
        discountAmount: 3500,
        finalAmount: 31500,
        couponId: 1,
        couponUsed: true
      };

      const mockOrder = new Order(1, 1, orderData.orderItems, 35000, 3500, 31500, 1, true, 'PENDING');
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      // Act
      const result = await service.createOrder(orderData);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('주문을 성공적으로 찾아야 한다', async () => {
      // Arrange
      const orderId = 1;
      const mockOrder = new Order(1, 1, [], 10000, 0, 10000, null, false, 'PENDING');
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findById(orderId);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it('주문이 존재하지 않으면 null을 반환해야 한다', async () => {
      // Arrange
      const orderId = 999;
      mockOrderRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(orderId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('주문을 성공적으로 저장해야 한다', async () => {
      // Arrange
      const mockOrder = new Order(1, 1, [], 10000, 0, 10000, null, false, 'PENDING');
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      // Act
      const result = await service.save(mockOrder);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('주문 상태 업데이트가 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const orderId = 1;
      const newStatus = 'PAID';
      const mockOrder = new Order(1, 1, [], 10000, 0, 10000, null, false, 'PENDING');
      const updatedOrder = new Order(1, 1, [], 10000, 0, 10000, null, false, 'PAID');

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(updatedOrder);

      // Act
      const result = await service.updateOrderStatus(orderId, newStatus);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(updatedOrder);
    });

    it('주문이 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const orderId = 999;
      const newStatus = 'PAID';

      mockOrderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateOrderStatus(orderId, newStatus)).rejects.toThrow('주문을 찾을 수 없습니다.');
    });
  });

  describe('findByUserId', () => {
    it('사용자의 주문 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockOrders = [
        new Order(1, userId, [], 10000, 0, 10000, null, false, 'PENDING'),
        new Order(2, userId, [], 15000, 1500, 13500, 1, true, 'PAID'),
      ];

      mockOrderRepository.findByUserId.mockResolvedValue(mockOrders);

      // Act
      const result = await service.findByUserId(userId);

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
}); 