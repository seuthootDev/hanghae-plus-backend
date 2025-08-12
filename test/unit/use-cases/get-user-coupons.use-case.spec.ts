import { Test, TestingModule } from '@nestjs/testing';
import { GetUserCouponsUseCase } from '../../../src/application/use-cases/coupons/get-user-coupons.use-case';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../../src/application/interfaces/services/coupon-service.interface';
import { Coupon } from '../../../src/domain/entities/coupon.entity';
import { CouponResponseDto } from '../../../src/presentation/dto/couponsDTO/coupon-response.dto';

describe('GetUserCouponsUseCase', () => {
  let useCase: GetUserCouponsUseCase;
  let mockCouponsService: jest.Mocked<CouponsServiceInterface>;

  beforeEach(async () => {
    const mockCouponsServiceProvider = {
      provide: COUPONS_SERVICE,
      useValue: {
        getUserCoupons: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserCouponsUseCase,
        mockCouponsServiceProvider,
      ],
    }).compile();

    useCase = module.get<GetUserCouponsUseCase>(GetUserCouponsUseCase);
    mockCouponsService = module.get(COUPONS_SERVICE);
  });

  describe('execute', () => {
    it('사용자의 쿠폰 목록을 성공적으로 반환해야 한다', async () => {
      // given
      const userId = 1;
      const mockCoupons: Coupon[] = [
        new Coupon(1, userId, 'DISCOUNT_10PERCENT', 10, 0, new Date('2025-12-31'), false),
        new Coupon(2, userId, 'FIXED_1000', 0, 1000, new Date('2025-12-31'), false),
      ];
      const expectedResponse: CouponResponseDto[] = [
        {
          couponId: 1,
          userId: 1,
          couponType: 'DISCOUNT_10PERCENT',
          discountRate: 10,
          expiryDate: '2025-12-31',
          isUsed: false,
        },
        {
          couponId: 2,
          userId: 1,
          couponType: 'FIXED_1000',
          discountRate: 0,
          expiryDate: '2025-12-31',
          isUsed: false,
        },
      ];

      mockCouponsService.getUserCoupons.mockResolvedValue(mockCoupons);

      // when
      const result = await useCase.execute(userId);

      // then
      expect(mockCouponsService.getUserCoupons).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(2);
    });

    it('사용자에게 쿠폰이 없으면 빈 배열을 반환해야 한다', async () => {
      // given
      const userId = 999;
      const mockCoupons: Coupon[] = [];
      const expectedResponse: CouponResponseDto[] = [];

      mockCouponsService.getUserCoupons.mockResolvedValue(mockCoupons);

      // when
      const result = await useCase.execute(userId);

      // then
      expect(mockCouponsService.getUserCoupons).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(0);
    });

    it('서비스에서 예외가 발생하면 예외를 전파해야 한다', async () => {
      // given
      const userId = 1;
      const errorMessage = '사용자를 찾을 수 없습니다';
      
      mockCouponsService.getUserCoupons.mockRejectedValue(new Error(errorMessage));

      // when & then
      await expect(useCase.execute(userId)).rejects.toThrow(errorMessage);
      expect(mockCouponsService.getUserCoupons).toHaveBeenCalledWith(userId);
    });
  });
}); 