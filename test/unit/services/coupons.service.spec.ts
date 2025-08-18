import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from '../../../src/infrastructure/services/coupon.service';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../../src/application/interfaces/repositories/coupon-repository.interface';
import { CouponValidationService } from '../../../src/domain/services/coupon-validation.service';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { IssueCouponDto, CouponType } from '../../../src/presentation/dto/couponsDTO/issue-coupon.dto';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { createMockRedisService } from '../../helpers/redis-mock.helper';

describe('CouponsService', () => {
  let service: CouponsService;
  let mockCouponRepository: jest.Mocked<CouponRepositoryInterface>;
  let mockCouponValidationService: jest.Mocked<CouponValidationService>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    const mockCouponRepositoryProvider = {
      provide: COUPON_REPOSITORY,
      useValue: {
        save: jest.fn(),
        findById: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

    const mockCouponValidationServiceProvider = {
      provide: CouponValidationService,
      useValue: {
        validateCouponType: jest.fn(),
        validateCouponExists: jest.fn(),
        validateCouponNotUsed: jest.fn(),
        validateCouponNotExpired: jest.fn(),
        validateUserHasCoupon: jest.fn(),
        validateCouponUsage: jest.fn(),
      },
    };

    const mockRedisServiceProvider = {
      provide: REDIS_SERVICE,
      useValue: createMockRedisService(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        mockCouponRepositoryProvider,
        mockCouponValidationServiceProvider,
        mockRedisServiceProvider,
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    mockCouponRepository = module.get(COUPON_REPOSITORY);
    mockCouponValidationService = module.get(CouponValidationService);
    mockRedisService = module.get(REDIS_SERVICE);
  });

  describe('issueCoupon', () => {
    it('쿠폰 발급이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);

      // Redis 재고 체크 모킹
      mockRedisService.decr.mockResolvedValue(99); // 재고가 있음
      mockCouponRepository.save.mockResolvedValue(mockCoupon);

      // Act
      const result = await service.issueCoupon(issueCouponDto);

      // Assert
      expect(result).toEqual(mockCoupon);
      expect(mockRedisService.decr).toHaveBeenCalledWith('coupon:stock:DISCOUNT_10PERCENT');
      expect(mockCouponRepository.save).toHaveBeenCalled();
    });

    it('재고가 부족하면 에러를 던져야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      // Redis 재고 부족 모킹
      mockRedisService.decr.mockResolvedValue(-1); // 재고 부족
      mockRedisService.incr.mockResolvedValue(0); // 롤백

      // Act & Assert
      await expect(service.issueCoupon(issueCouponDto)).rejects.toThrow('DISCOUNT_10PERCENT 쿠폰이 소진되었습니다.');
      expect(mockRedisService.decr).toHaveBeenCalledWith('coupon:stock:DISCOUNT_10PERCENT');
      expect(mockRedisService.incr).toHaveBeenCalledWith('coupon:stock:DISCOUNT_10PERCENT');
    });
  });

  describe('getUserCoupons', () => {
    it('사용자의 쿠폰 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockCoupons = [
        new Coupon(1, userId, 'DISCOUNT_10PERCENT', 10, 0, new Date(), false),
        new Coupon(2, userId, 'FIXED_1000', 0, 1000, new Date(), false),
      ];

      mockCouponRepository.findByUserId.mockResolvedValue(mockCoupons);

      // Act
      const result = await service.getUserCoupons(userId);

      // Assert
      expect(result).toEqual(mockCoupons);
      expect(mockCouponRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('validateAndCalculateDiscount', () => {
    it('쿠폰이 없을 때 기본값을 반환해야 한다', async () => {
      // Arrange
      const couponId = null;
      const totalAmount = 10000;

      // Act
      const result = await service.validateAndCalculateDiscount(couponId, totalAmount);

      // Assert
      expect(result).toEqual({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });
    });

    it('쿠폰이 존재하지 않을 때 기본값을 반환해야 한다', async () => {
      // Arrange
      const couponId = 999;
      const totalAmount = 10000;

      mockCouponRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.validateAndCalculateDiscount(couponId, totalAmount);

      // Assert
      expect(result).toEqual({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });
      expect(mockCouponRepository.findById).toHaveBeenCalledWith(couponId);
    });

    it('유효한 쿠폰에 대해 할인을 계산해야 한다', async () => {
      // Arrange
      const couponId = 1;
      const totalAmount = 10000;
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10PERCENT', 10, 0, new Date(), false);
      mockCoupon.isValid = jest.fn().mockReturnValue(true);
      mockCoupon.calculateDiscount = jest.fn().mockReturnValue(1000);

      mockCouponRepository.findById.mockResolvedValue(mockCoupon);
      mockCouponValidationService.validateCouponUsage.mockImplementation(() => {});

      // Act
      const result = await service.validateAndCalculateDiscount(couponId, totalAmount);

      // Assert
      expect(result).toEqual({
        coupon: mockCoupon,
        discountAmount: 1000,
        couponUsed: true
      });
      expect(mockCouponValidationService.validateCouponUsage).toHaveBeenCalledWith(mockCoupon);
      expect(mockCoupon.isValid).toHaveBeenCalled();
      expect(mockCoupon.calculateDiscount).toHaveBeenCalledWith(totalAmount);
    });

    it('유효하지 않은 쿠폰에 대해 기본값을 반환해야 한다', async () => {
      // Arrange
      const couponId = 1;
      const totalAmount = 10000;
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10PERCENT', 10, 0, new Date(), false);
      mockCoupon.isValid = jest.fn().mockReturnValue(false);

      mockCouponRepository.findById.mockResolvedValue(mockCoupon);
      mockCouponValidationService.validateCouponUsage.mockImplementation(() => {});

      // Act
      const result = await service.validateAndCalculateDiscount(couponId, totalAmount);

      // Assert
      expect(result).toEqual({
        coupon: null,
        discountAmount: 0,
        couponUsed: false
      });
      expect(mockCouponValidationService.validateCouponUsage).toHaveBeenCalledWith(mockCoupon);
      expect(mockCoupon.isValid).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('쿠폰을 성공적으로 찾아야 한다', async () => {
      // Arrange
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10PERCENT', 10, 0, new Date(), false);
      mockCouponRepository.findById.mockResolvedValue(mockCoupon);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockCoupon);
      expect(mockCouponRepository.findById).toHaveBeenCalledWith(1);
    });

    it('쿠폰이 존재하지 않으면 null을 반환해야 한다', async () => {
      // Arrange
      mockCouponRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('쿠폰을 성공적으로 저장해야 한다', async () => {
      // Arrange
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_10PERCENT', 10, 0, new Date(), false);
      mockCouponRepository.save.mockResolvedValue(mockCoupon);

      // Act
      const result = await service.save(mockCoupon);

      // Assert
      expect(result).toEqual(mockCoupon);
      expect(mockCouponRepository.save).toHaveBeenCalledWith(mockCoupon);
    });
  });
}); 