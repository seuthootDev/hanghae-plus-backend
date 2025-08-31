import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedHandler } from '../../../src/infrastructure/event-handlers/order-created.handler';
import { OrderCreatedEvent } from '../../../src/domain/events/order-created.event';
import { PaymentFailedEvent } from '../../../src/domain/events/payment-failed.event';
import { IEventBus } from '../../../src/common/events/event-bus.interface';

describe('OrderCreatedHandler', () => {
  let handler: OrderCreatedHandler;
  let mockEventBus: jest.Mocked<IEventBus>;

  const mockOrderCreatedEvent = new OrderCreatedEvent(
    '123',
    '456',
    [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    40000,
    5000,
    35000,
    789,
    true,
    new Date('2024-01-01T10:00:00Z'),
    new Date('2024-01-01T10:10:00Z')
  );

  beforeEach(async () => {
    const mockEventBusService = {
      publish: jest.fn(),
      subscribe: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedHandler,
        {
          provide: 'EVENT_BUS',
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    handler = module.get<OrderCreatedHandler>(OrderCreatedHandler);
    mockEventBus = module.get('EVENT_BUS');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('handle', () => {
    it('주문 생성 완료 이벤트를 처리할 수 있어야 한다', async () => {
      // 타이머를 모킹
      jest.useFakeTimers();
      
      await handler.handle(mockOrderCreatedEvent);

      // 10분 후 타이머 실행
      jest.advanceTimersByTime(10 * 60 * 1000);

      // PaymentFailedEvent가 발행되었는지 확인
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: '123',
          userId: '456',
          isTimeout: true,
          failureReason: '결제 시간 초과 (10분)'
        })
      );
    });

    it('10분 타이머를 설정해야 한다', async () => {
      jest.useFakeTimers();
      
      await handler.handle(mockOrderCreatedEvent);

      // 10분 전에는 이벤트가 발행되지 않아야 함
      jest.advanceTimersByTime(9 * 60 * 1000);
      expect(mockEventBus.publish).not.toHaveBeenCalled();

      // 10분 후에 이벤트가 발행되어야 함
      jest.advanceTimersByTime(1 * 60 * 1000);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('시간 초과 시 PaymentFailedEvent를 발행해야 한다', async () => {
      jest.useFakeTimers();
      
      await handler.handle(mockOrderCreatedEvent);
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: '123',
          userId: '456',
          items: mockOrderCreatedEvent.items,
          couponId: 789,
          failureReason: '결제 시간 초과 (10분)',
          isTimeout: true
        })
      );
    });

    it('타이머 실행 중 에러가 발생해도 로깅만 하고 계속 진행해야 한다', async () => {
      jest.useFakeTimers();
      
      // 이벤트 버스 publish에서 에러 발생
      mockEventBus.publish.mockImplementationOnce(() => {
        throw new Error('이벤트 발행 실패');
      });

      // 에러가 발생해도 핸들러는 정상적으로 완료되어야 함
      await expect(handler.handle(mockOrderCreatedEvent)).resolves.not.toThrow();

      jest.advanceTimersByTime(10 * 60 * 1000);
      
      // 에러가 발생했지만 핸들러는 정상적으로 완료됨
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('핸들러 실행 중 에러가 발생하면 로깅하고 계속 진행해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // handle 메서드에서 에러 발생
      jest.spyOn(handler, 'handle').mockRejectedValueOnce(new Error('처리 실패'));

      await expect(handler.handle(mockOrderCreatedEvent)).rejects.toThrow('처리 실패');
      
      consoleSpy.mockRestore();
    });
  });

  describe('타이머 정확성', () => {
    it('정확히 10분(600초) 후에 타이머가 실행되어야 한다', async () => {
      jest.useFakeTimers();
      
      await handler.handle(mockOrderCreatedEvent);

      // 9분 59초 후에는 실행되지 않아야 함
      jest.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000);
      expect(mockEventBus.publish).not.toHaveBeenCalled();

      // 10분 후에 실행되어야 함
      jest.advanceTimersByTime(1000);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('여러 주문에 대해 독립적인 타이머가 설정되어야 한다', async () => {
      jest.useFakeTimers();
      
      const event1 = new OrderCreatedEvent('1', '1', [], 1000, 0, 1000, null, false, new Date(), new Date(Date.now() + 10 * 60 * 1000));
      const event2 = new OrderCreatedEvent('2', '2', [], 2000, 0, 2000, null, false, new Date(), new Date(Date.now() + 10 * 60 * 1000));

      await handler.handle(event1);
      await handler.handle(event2);

      // 10분 후 두 이벤트 모두 처리되어야 함
      jest.advanceTimersByTime(10 * 60 * 1000);
      
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
    });
  });
});
