import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from '../../../src/infrastructure/services/coupons.service';
import { CouponRepositoryInterface, COUPON_REPOSITORY } from '../../../src/application/interfaces/repositories/coupon-repository.interface';
import { CouponValidationService } from '../../../src/domain/services/coupon-validation.service';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { IssueCouponDto, CouponType } from '../../../src/presentation/dto/couponsDTO/issue-coupon.dto';

describe('CouponsService', () => {
  let service: CouponsService;
  let mockCouponRepository: jest.Mocked<CouponRepositoryInterface>;
  let mockCouponValidationService: jest.Mocked<CouponValidationService>;

  beforeEach(async () => {
    const mockCouponRepositoryProvider = {
      provide: COUPON_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
        findByUserId: jest.fn(),
        findByType: jest.fn(),
      },
    };

    const mockCouponValidationServiceProvider = {
      provide: CouponValidationService,
      useValue: {
        validateCouponIssuance: jest.fn(),
        validateCouponUsage: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        mockCouponRepositoryProvider,
        mockCouponValidationServiceProvider,
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    mockCouponRepository = module.get('COUPON_REPOSITORY');
    mockCouponValidationService = module.get(CouponValidationService);
  });

  describe('issueCoupon', () => {
    it('쿠폰 발급이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      const existingCoupons: Coupon[] = [];
      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);

      mockCouponRepository.findByType.mockResolvedValue(existingCoupons);
      mockCouponRepository.save.mockResolvedValue(mockCoupon);

      // Act
      const result = await service.issueCoupon(issueCouponDto);

      // Assert
      expect(result).toEqual(mockCoupon);
      expect(mockCouponRepository.findByType).toHaveBeenCalledWith(CouponType.DISCOUNT_10PERCENT);
      expect(mockCouponValidationService.validateCouponIssuance).toHaveBeenCalledWith(CouponType.DISCOUNT_10PERCENT, existingCoupons);
      expect(mockCouponRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUserCoupons', () => {
    it('사용자의 쿠폰 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockCoupons = [
        new Coupon(1, userId, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false),
        new Coupon(2, userId, CouponType.FIXED_1000, 0, 1000, new Date(), false),
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
      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);
      mockCoupon.isValid = jest.fn().mockReturnValue(true);
      mockCoupon.calculateDiscount = jest.fn().mockReturnValue(1000);

      mockCouponRepository.findById.mockResolvedValue(mockCoupon);

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
      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);
      mockCoupon.isValid = jest.fn().mockReturnValue(false);

      mockCouponRepository.findById.mockResolvedValue(mockCoupon);

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
      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);
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
      const mockCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(), false);
      mockCouponRepository.save.mockResolvedValue(mockCoupon);

      // Act
      const result = await service.save(mockCoupon);

      // Assert
      expect(result).toEqual(mockCoupon);
      expect(mockCouponRepository.save).toHaveBeenCalledWith(mockCoupon);
    });
  });
}); 