import { Test, TestingModule } from '@nestjs/testing';
import { IssueCouponUseCase } from '../../../src/application/use-cases/coupons/issue-coupon.use-case';
import { CouponsServiceInterface } from '../../../src/application/interfaces/services/coupons-service.interface';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { IssueCouponDto, CouponType } from '../../../src/presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../src/presentation/dto/couponsDTO/coupon-response.dto';

describe('IssueCouponUseCase', () => {
  let useCase: IssueCouponUseCase;
  let mockCouponsService: jest.Mocked<CouponsServiceInterface>;

  beforeEach(async () => {
    const mockCouponsServiceProvider = {
      provide: 'COUPONS_SERVICE',
      useValue: {
        issueCoupon: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueCouponUseCase,
        mockCouponsServiceProvider,
      ],
    }).compile();

    useCase = module.get<IssueCouponUseCase>(IssueCouponUseCase);
    mockCouponsService = module.get('COUPONS_SERVICE');
  });

  describe('execute', () => {
    it('쿠폰 발급이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_20PERCENT;

      const futureDate = new Date('2024-12-31');
      const mockCoupon = new Coupon(1, 1, 'DISCOUNT_20PERCENT', 20, 0, futureDate, false);
      const expectedResponseDto: CouponResponseDto = {
        couponId: 1,
        userId: 1,
        couponType: 'DISCOUNT_20PERCENT',
        discountRate: 20,
        expiryDate: '2024-12-31',
        isUsed: false,
      };

      mockCouponsService.issueCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute(issueCouponDto);

      // Assert
      expect(mockCouponsService.issueCoupon).toHaveBeenCalledWith(issueCouponDto);
      expect(result).toEqual(expectedResponseDto);
    });

    it('고정 할인 쿠폰도 처리해야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 2;
      issueCouponDto.couponType = CouponType.FIXED_2000;

      const futureDate = new Date('2024-12-31');
      const mockCoupon = new Coupon(2, 2, 'FIXED_2000', 0, 2000, futureDate, false);
      const expectedResponseDto: CouponResponseDto = {
        couponId: 2,
        userId: 2,
        couponType: 'FIXED_2000',
        discountRate: 0,
        expiryDate: '2024-12-31',
        isUsed: false,
      };

      mockCouponsService.issueCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute(issueCouponDto);

      // Assert
      expect(mockCouponsService.issueCoupon).toHaveBeenCalledWith(issueCouponDto);
      expect(result).toEqual(expectedResponseDto);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      const mockError = new Error('쿠폰 발급에 실패했습니다.');
      mockCouponsService.issueCoupon.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(issueCouponDto)).rejects.toThrow(
        '쿠폰 발급에 실패했습니다.'
      );
    });
  });
}); 