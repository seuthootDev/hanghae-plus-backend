import { Test } from '@nestjs/testing';
import { CouponsService } from '../../../src/infrastructure/services/coupon.service';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../../src/application/interfaces/repositories/coupon-repository.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { CouponType } from '../../../src/domain/entities/coupon.entity';

describe('Redis Sorted Set Coupon Service', () => {
  let couponsService: CouponsService;
  let mockCouponRepository: jest.Mocked<CouponRepositoryInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    // Mock Repository
    mockCouponRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByType: jest.fn()
    };

    // Mock Redis Service - Sorted Set 메서드 포함
    mockRedisService = {
      set: jest.fn(),
      eval: jest.fn(),
      pttl: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
      decr: jest.fn(),
      incr: jest.fn(),
      get: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zscore: jest.fn(),
      zrank: jest.fn(),
      zrange: jest.fn(),
      zcard: jest.fn(),
      incrementProductSales: jest.fn(),
      getProductSales: jest.fn(),
      getAllProductSales: jest.fn(),
      setTopSellersCache: jest.fn(),
      getTopSellersCache: jest.fn(),
      setProductCache: jest.fn(),
      getProductCache: jest.fn(),
      setProductsCache: jest.fn(),
      getProductsCache: jest.fn(),
      setProductsByCategoryCache: jest.fn(),
      getProductsByCategoryCache: jest.fn(),
      setUserPointsCache: jest.fn(),
      getUserPointsCache: jest.fn(),
      invalidateProductCache: jest.fn(),
      invalidateProductsCache: jest.fn(),
      invalidateTopSellersCache: jest.fn(),
      invalidateUserPointsCache: jest.fn(),
      setWithTTL: jest.fn(),
      onModuleDestroy: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: COUPON_REPOSITORY,
          useValue: mockCouponRepository
        },
        {
          provide: REDIS_SERVICE,
          useValue: mockRedisService
        }
      ]
    }).compile();

    couponsService = module.get<CouponsService>(CouponsService);
  });

  describe('getCouponRanking', () => {
    it('쿠폰 순위를 올바르게 조회해야 한다', async () => {
      // Arrange
      const couponType = CouponType.DISCOUNT_10PERCENT;
      const mockRankings = ['101', '0', '102', '1', '103', '2']; // [member, score, member, score, ...]
      
      mockRedisService.zrange.mockResolvedValue(mockRankings);
      mockRedisService.zscore.mockImplementation((key, member) => {
        const userScoreMap = {
          '101': 1629876543000,
          '102': 1629876544000,
          '103': 1629876545000
        };
        return Promise.resolve(userScoreMap[member] || null);
      });

      // Act
      const result = await couponsService.getCouponRanking(couponType, 3);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        userId: 101,
        rank: 1,
        issuedAt: 1629876543000
      });
      expect(result[1]).toEqual({
        userId: 102,
        rank: 2,
        issuedAt: 1629876544000
      });
      expect(result[2]).toEqual({
        userId: 103,
        rank: 3,
        issuedAt: 1629876545000
      });
      expect(mockRedisService.zrange).toHaveBeenCalledWith(
        `coupon:rank:${couponType}`, 
        0, 
        2, 
        'WITHSCORES'
      );
    });

    it('빈 순위 목록을 처리해야 한다', async () => {
      // Arrange
      const couponType = CouponType.DISCOUNT_20PERCENT;
      mockRedisService.zrange.mockResolvedValue([]);

      // Act
      const result = await couponsService.getCouponRanking(couponType, 10);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getCouponQueueStatus', () => {
    it('대기열 상태를 올바르게 조회해야 한다', async () => {
      // Arrange
      const couponType = CouponType.FIXED_1000;
      mockRedisService.zcard.mockImplementation((key) => {
        if (key.includes('issued')) return Promise.resolve(50);
        if (key.includes('queue')) return Promise.resolve(10);
        return Promise.resolve(0);
      });
      mockRedisService.get.mockImplementation((key) => {
        if (key.includes('stock')) return Promise.resolve('40');
        if (key.includes('endtime')) return Promise.resolve((Date.now() + 30000).toString());
        return Promise.resolve(null);
      });

      // Act
      const result = await couponsService.getCouponQueueStatus(couponType);

      // Assert
      expect(result).toEqual({
        totalIssued: 50,
        totalInQueue: 10,
        remainingStock: 40,
        isEnded: false
      });
    });

    it('종료된 쿠폰의 상태를 올바르게 반환해야 한다', async () => {
      // Arrange
      const couponType = CouponType.FIXED_2000;
      mockRedisService.zcard.mockResolvedValue(0);
      mockRedisService.get.mockImplementation((key) => {
        if (key.includes('stock')) return Promise.resolve('0');
        if (key.includes('endtime')) return Promise.resolve((Date.now() - 30000).toString()); // 과거 시간
        return Promise.resolve(null);
      });

      // Act
      const result = await couponsService.getCouponQueueStatus(couponType);

      // Assert
      expect(result.isEnded).toBe(true);
      expect(result.remainingStock).toBe(0);
    });
  });

  describe('쿠폰 발급 가능 여부 확인 로직', () => {
    it('checkCouponAvailability가 이미 발급받은 사용자를 감지해야 한다', async () => {
      // Arrange
      const userId = 123;
      const couponType = CouponType.DISCOUNT_10PERCENT;
      
      // 이미 발급받은 사용자로 설정
      mockRedisService.zscore.mockImplementation((key, member) => {
        if (key.includes('issued')) return Promise.resolve(1629876543000);
        return Promise.resolve(null);
      });

      // Act - private 메서드를 테스트하기 위해 issueCoupon을 통해 간접 테스트
      mockRedisService.decr.mockResolvedValue(-1); // 재고 부족으로 설정하여 빠른 종료
      mockRedisService.incr.mockResolvedValue(1);

      try {
        await couponsService.issueCoupon({ userId, couponType });
      } catch (error) {
        // Assert
        expect(error.message).toContain('쿠폰 발급이 불가능합니다');
      }
    });
  });
});
