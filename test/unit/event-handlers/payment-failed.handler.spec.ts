import { Test, TestingModule } from '@nestjs/testing';
import { PaymentFailedHandler } from '../../../src/infrastructure/event-handlers/payment-failed.handler';
import { PaymentFailedEvent } from '../../../src/domain/events/payment-failed.event';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../../src/application/interfaces/services/product-service.interface';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../../src/application/interfaces/services/coupon-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { Product } from '../../../src/domain/entities/product.entity';
import { Coupon } from '../../../src/domain/entities/coupon.entity';

describe('PaymentFailedHandler', () => {
  let handler: PaymentFailedHandler;
  let mockProductsService: jest.Mocked<ProductsServiceInterface>;
  let mockCouponsService: jest.Mocked<CouponsServiceInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  const mockPaymentFailedEvent = new PaymentFailedEvent(
    '123',
    '456',
    [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    789, // couponId
    '카드 한도 초과',
    new Date('2024-01-01T10:00:00Z'),
    false // isTimeout = false
  );

  const mockTimeoutEvent = new PaymentFailedEvent(
    '123',
    '456',
    [
      { productId: 1, quantity: 2, price: 10000 },
      { productId: 2, quantity: 1, price: 20000 }
    ],
    789, // couponId
    '결제 시간 초과 (10분)',
    new Date('2024-01-01T10:00:00Z'),
    true // isTimeout = true
  );

  const mockProduct = {
    id: 1,
    name: '테스트 상품',
    price: 10000,
    stock: 5,
    increaseStock: jest.fn(),
    decreaseStock: jest.fn()
  } as any;

  const mockCoupon = {
    id: 789,
    userId: 456,
    couponType: 'DISCOUNT_10PERCENT',
    discountRate: 10,
    discountAmount: 0,
    expiryDate: new Date('2024-12-31'),
    isUsed: true,
    revertUsage: jest.fn()
  } as any;

  beforeEach(async () => {
    const mockProductsServiceService = {
      findById: jest.fn(),
      save: jest.fn(),
      validateAndReserveProducts: jest.fn(),
      getProducts: jest.fn()
    };

    const mockCouponsServiceService = {
      findById: jest.fn(),
      save: jest.fn(),
      validateAndCalculateDiscount: jest.fn(),
      issueCoupon: jest.fn(),
      getUserCoupons: jest.fn()
    };

    const mockRedisServiceService = {
      zscore: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      decr: jest.fn(),
      incr: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentFailedHandler,
        {
          provide: PRODUCTS_SERVICE,
          useValue: mockProductsServiceService,
        },
        {
          provide: COUPONS_SERVICE,
          useValue: mockCouponsServiceService,
        },
        {
          provide: REDIS_SERVICE,
          useValue: mockRedisServiceService,
        },
      ],
    }).compile();

    handler = module.get<PaymentFailedHandler>(PaymentFailedHandler);
    mockProductsService = module.get(PRODUCTS_SERVICE);
    mockCouponsService = module.get(COUPONS_SERVICE);
    mockRedisService = module.get(REDIS_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    describe('시간 초과로 인한 실패 (isTimeout = true)', () => {
      it('보상 트랜잭션을 수행해야 한다', async () => {
        mockProductsService.findById.mockResolvedValue(mockProduct);
        mockProductsService.save.mockResolvedValue(mockProduct);
        mockCouponsService.findById.mockResolvedValue(mockCoupon);
        mockCouponsService.save.mockResolvedValue(mockCoupon);
        mockRedisService.zscore.mockResolvedValue(10);
        mockRedisService.zadd.mockResolvedValue(1);

        await handler.handle(mockTimeoutEvent);

        // 재고 복구 확인
        expect(mockProductsService.findById).toHaveBeenCalledWith(1);
        expect(mockProductsService.findById).toHaveBeenCalledWith(2);
        expect(mockProductsService.save).toHaveBeenCalledTimes(2);

        // 쿠폰 복구 확인
        expect(mockCouponsService.findById).toHaveBeenCalledWith(789);
        expect(mockCouponsService.save).toHaveBeenCalledWith(mockCoupon);

        // Redis 랭킹 복구 확인
        expect(mockRedisService.zscore).toHaveBeenCalledTimes(2);
        expect(mockRedisService.zadd).toHaveBeenCalledTimes(2);
      });

      it('보상 트랜잭션 실패 시 예외를 전파해야 한다', async () => {
        mockProductsService.findById.mockRejectedValue(new Error('상품 조회 실패'));

        await expect(handler.handle(mockTimeoutEvent)).rejects.toThrow('상품 조회 실패');
      });
    });

    describe('일반 결제 실패 (isTimeout = false)', () => {
      it('보상 트랜잭션을 수행하지 않아야 한다', async () => {
        await handler.handle(mockPaymentFailedEvent);

        // 보상 트랜잭션이 호출되지 않아야 함
        expect(mockProductsService.findById).not.toHaveBeenCalled();
        expect(mockProductsService.save).not.toHaveBeenCalled();
        expect(mockCouponsService.findById).not.toHaveBeenCalled();
        expect(mockCouponsService.save).not.toHaveBeenCalled();
        expect(mockRedisService.zscore).not.toHaveBeenCalled();
        expect(mockRedisService.zadd).not.toHaveBeenCalled();
      });

      it('일반 결제 실패는 로깅만 하고 보상 트랜잭션 없이 완료되어야 한다', async () => {
        await expect(handler.handle(mockPaymentFailedEvent)).resolves.not.toThrow();
      });
    });

    it('쿠폰을 사용하지 않은 경우 쿠폰 복구를 건너뛰어야 한다', async () => {
      const eventWithoutCoupon = new PaymentFailedEvent(
        '123',
        '456',
        [{ productId: 1, quantity: 2, price: 10000 }],
        null, // couponId가 null
        '결제 시간 초과 (10분)',
        new Date(),
        true // isTimeout = true
      );

      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockProductsService.save.mockResolvedValue(mockProduct);
      mockRedisService.zscore.mockResolvedValue(10);
      mockRedisService.zadd.mockResolvedValue(1);

      await handler.handle(eventWithoutCoupon);

      // 쿠폰 복구가 호출되지 않아야 함
      expect(mockCouponsService.findById).not.toHaveBeenCalled();
      expect(mockCouponsService.save).not.toHaveBeenCalled();
    });
  });

  describe('restoreProductStock', () => {
    it('상품 재고를 복구할 수 있어야 한다', async () => {
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockProductsService.save.mockResolvedValue(mockProduct);

      await handler['restoreProductStock']([
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 20000 }
      ]);

      expect(mockProductsService.findById).toHaveBeenCalledWith(1);
      expect(mockProductsService.findById).toHaveBeenCalledWith(2);
      expect(mockProduct.increaseStock).toHaveBeenCalledWith(2);
      expect(mockProduct.increaseStock).toHaveBeenCalledWith(1);
      expect(mockProductsService.save).toHaveBeenCalledTimes(2);
    });

    it('상품이 존재하지 않는 경우 에러를 던져야 한다', async () => {
      mockProductsService.findById.mockResolvedValue(null);

      await expect(handler['restoreProductStock']([
        { productId: 999, quantity: 1, price: 10000 }
      ])).rejects.toThrow('상품 999를 찾을 수 없습니다.');
    });

    it('재고 복구 중 에러가 발생하면 예외를 전파해야 한다', async () => {
      mockProductsService.findById.mockResolvedValue(mockProduct);
      mockProductsService.save.mockRejectedValue(new Error('저장 실패'));

      await expect(handler['restoreProductStock']([
        { productId: 1, quantity: 2, price: 10000 }
      ])).rejects.toThrow('저장 실패');
    });
  });

  describe('restoreCouponUsage', () => {
    it('쿠폰 사용 상태를 복구할 수 있어야 한다', async () => {
      mockCouponsService.findById.mockResolvedValue(mockCoupon);
      mockCouponsService.save.mockResolvedValue(mockCoupon);

      await handler['restoreCouponUsage'](789);

      expect(mockCouponsService.findById).toHaveBeenCalledWith(789);
      expect(mockCoupon.revertUsage).toHaveBeenCalled();
      expect(mockCouponsService.save).toHaveBeenCalledWith(mockCoupon);
    });

    it('쿠폰이 존재하지 않는 경우 에러를 던져야 한다', async () => {
      mockCouponsService.findById.mockResolvedValue(null);

      await expect(handler['restoreCouponUsage'](999)).rejects.toThrow('쿠폰 999를 찾을 수 없습니다.');
    });

    it('쿠폰이 사용되지 않은 상태인 경우 복구를 건너뛰어야 한다', async () => {
      const unusedCoupon = { ...mockCoupon, isUsed: false };
      mockCouponsService.findById.mockResolvedValue(unusedCoupon);

      await handler['restoreCouponUsage'](789);

      expect(unusedCoupon.revertUsage).not.toHaveBeenCalled();
      expect(mockCouponsService.save).not.toHaveBeenCalled();
    });
  });

  describe('restoreProductRanking', () => {
    it('Redis 상품 랭킹을 복구할 수 있어야 한다', async () => {
      mockRedisService.zscore.mockResolvedValue(10);
      mockRedisService.zadd.mockResolvedValue(1);

      await handler['restoreProductRanking']([
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 20000 }
      ]);

      expect(mockRedisService.zscore).toHaveBeenCalledTimes(2);
      expect(mockRedisService.zadd).toHaveBeenCalledTimes(2);
      
      // 첫 번째 상품: 10 - 2 = 8
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        expect.stringContaining('product:ranking:'),
        8,
        '1'
      );
      
      // 두 번째 상품: 10 - 1 = 9
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        expect.stringContaining('product:ranking:'),
        9,
        '2'
      );
    });

    it('Redis 랭킹이 존재하지 않는 경우 복구를 건너뛰어야 한다', async () => {
      mockRedisService.zscore.mockResolvedValue(null);

      await handler['restoreProductRanking']([
        { productId: 1, quantity: 2, price: 10000 }
      ]);

      expect(mockRedisService.zscore).toHaveBeenCalledWith(
        expect.stringContaining('product:ranking:'),
        '1'
      );
      expect(mockRedisService.zadd).not.toHaveBeenCalled();
    });

    it('개별 상품 랭킹 복구 실패 시 로깅하고 계속 진행해야 한다', async () => {
      mockRedisService.zscore
        .mockResolvedValueOnce(10) // 첫 번째 상품 성공
        .mockRejectedValueOnce(new Error('Redis 오류')); // 두 번째 상품 실패
      mockRedisService.zadd.mockResolvedValue(1);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await handler['restoreProductRanking']([
        { productId: 1, quantity: 2, price: 10000 },
        { productId: 2, quantity: 1, price: 20000 }
      ]);

      // 첫 번째 상품은 성공적으로 복구되어야 함
      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        expect.stringContaining('product:ranking:'),
        8,
        '1'
      );

      // 에러 로깅 확인
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ 상품 2 랭킹 복구 실패:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('Redis 랭킹 복구는 개별 상품 실패 시에도 전체 프로세스가 계속되어야 한다', async () => {
      mockRedisService.zscore.mockRejectedValue(new Error('Redis 연결 실패'));

      // Redis 랭킹 복구는 에러를 전파하지 않고 로깅만 함
      await expect(handler['restoreProductRanking']([
        { productId: 1, quantity: 2, price: 10000 }
      ])).resolves.toBeUndefined();
    });
  });

  describe('에러 처리 전략', () => {
    it('시간 초과가 아닌 경우 보상 트랜잭션 실패가 발생해도 예외를 전파하지 않아야 한다', async () => {
      // 일반 결제 실패는 보상 트랜잭션을 수행하지 않으므로 에러가 발생하지 않음
      await expect(handler.handle(mockPaymentFailedEvent)).resolves.not.toThrow();
    });

    it('시간 초과인 경우 보상 트랜잭션 실패 시 예외를 전파해야 한다', async () => {
      mockProductsService.findById.mockRejectedValue(new Error('상품 조회 실패'));

      await expect(handler.handle(mockTimeoutEvent)).rejects.toThrow('상품 조회 실패');
    });
  });
});
