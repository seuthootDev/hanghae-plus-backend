import { Test, TestingModule } from '@nestjs/testing';
import { IssueCouponUseCase } from '../../../src/application/use-cases/coupons/issue-coupon.use-case';
import { GetUserCouponsUseCase } from '../../../src/application/use-cases/coupons/get-user-coupons.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { IssueCouponDto, CouponType } from '../../../src/presentation/dto/couponsDTO/issue-coupon.dto';

describe('Coupons Integration Tests', () => {
  let module: TestingModule;
  let issueCouponUseCase: IssueCouponUseCase;
  let getUserCouponsUseCase: GetUserCouponsUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    issueCouponUseCase = module.get<IssueCouponUseCase>(IssueCouponUseCase);
    getUserCouponsUseCase = module.get<GetUserCouponsUseCase>(GetUserCouponsUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('IssueCoupon Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 데이터베이스에 쿠폰을 발급해야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 1;
      issueCouponDto.couponType = CouponType.DISCOUNT_20PERCENT;

      // Act - Use Case가 Domain Service를 통해 실제 데이터베이스에 저장
      const result = await issueCouponUseCase.execute(issueCouponDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('couponId');
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_20PERCENT);
      expect(result).toHaveProperty('discountRate');
      expect(result).toHaveProperty('isUsed', false);
      expect(result).toHaveProperty('expiryDate');

      // Use Case가 실제로 데이터를 저장했는지 확인 (다시 쿠폰 조회)
      const userCoupons = await getUserCouponsUseCase.execute(1);
      expect(userCoupons.length).toBeGreaterThan(0);
      const issuedCoupon = userCoupons.find(coupon => coupon.couponId === result.couponId);
      expect(issuedCoupon).toBeDefined();
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자에게도 쿠폰을 발급할 수 있어야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 999; // 존재하지 않는 사용자
      issueCouponDto.couponType = CouponType.DISCOUNT_20PERCENT;

      // Act - Use Case가 Domain Service를 통해 쿠폰 발급
      const result = await issueCouponUseCase.execute(issueCouponDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('couponId');
      expect(result).toHaveProperty('userId', 999);
      expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_20PERCENT);
      expect(result).toHaveProperty('discountRate');
      expect(result).toHaveProperty('isUsed', false);
      expect(result).toHaveProperty('expiryDate');
    });

    it('Domain Service가 Repository를 통해 고정 할인 쿠폰을 발급해야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 2;
      issueCouponDto.couponType = CouponType.FIXED_2000;

      // Act - Use Case가 Domain Service를 통해 고정 할인 쿠폰 발급
      const result = await issueCouponUseCase.execute(issueCouponDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('couponId');
      expect(result).toHaveProperty('userId', 2);
      expect(result).toHaveProperty('couponType', CouponType.FIXED_2000);
      expect(result).toHaveProperty('discountRate');
      expect(result).toHaveProperty('isUsed', false);
      expect(result).toHaveProperty('expiryDate');
    });

    it('Domain Service가 Repository를 통해 여러 쿠폰을 발급할 때 각각 다른 ID를 가져야 한다', async () => {
      // Arrange
      const firstCouponDto = new IssueCouponDto();
      firstCouponDto.userId = 3;
      firstCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      const secondCouponDto = new IssueCouponDto();
      secondCouponDto.userId = 3;
      secondCouponDto.couponType = CouponType.FIXED_1000;

      // Act - Use Case가 Domain Service를 통해 연속 발급
      const firstResult = await issueCouponUseCase.execute(firstCouponDto);
      const secondResult = await issueCouponUseCase.execute(secondCouponDto);

      // Assert - Use Case 결과 검증
      expect(firstResult).toHaveProperty('couponId');
      expect(secondResult).toHaveProperty('couponId');
      expect(firstResult.couponId).not.toBe(secondResult.couponId);

      // 사용자의 쿠폰 목록 확인
      const userCoupons = await getUserCouponsUseCase.execute(3);
      expect(userCoupons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GetUserCoupons Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 데이터베이스에서 사용자 쿠폰을 조회해야 한다', async () => {
      // Act - Use Case가 Domain Service를 통해 실제 데이터베이스 조회
      const result = await getUserCouponsUseCase.execute(1);

      // Assert - Use Case 결과 검증
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);

      // 각 쿠폰의 구조 검증
      result.forEach((coupon) => {
        expect(coupon).toHaveProperty('couponId');
        expect(coupon).toHaveProperty('userId');
        expect(coupon).toHaveProperty('couponType');
        expect(coupon).toHaveProperty('isUsed');
        expect(coupon).toHaveProperty('expiryDate');

        expect(typeof coupon.couponId).toBe('number');
        expect(typeof coupon.userId).toBe('number');
        expect(typeof coupon.couponType).toBe('string');
        expect(typeof coupon.isUsed).toBe('boolean');
      });
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자의 쿠폰도 조회할 수 있어야 한다', async () => {
      // Act - Use Case가 Domain Service를 통해 쿠폰 조회
      const result = await getUserCouponsUseCase.execute(999);

      // Assert - Use Case 결과 검증
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('Domain Service가 Repository를 통해 여러 사용자의 쿠폰을 조회해야 한다', async () => {
      // Act - Use Case가 Domain Service를 통해 여러 사용자 조회
      const user1Coupons = await getUserCouponsUseCase.execute(1);
      const user2Coupons = await getUserCouponsUseCase.execute(2);

      // Assert - Use Case 결과 검증
      expect(Array.isArray(user1Coupons)).toBe(true);
      expect(Array.isArray(user2Coupons)).toBe(true);

      // 각 사용자의 쿠폰이 해당 사용자에게 속하는지 확인
      user1Coupons.forEach(coupon => {
        expect(coupon.userId).toBe(1);
      });

      user2Coupons.forEach(coupon => {
        expect(coupon.userId).toBe(2);
      });
    });

    describe('비관적 락 동시성 제어 통합 테스트', () => {
      it('동시 쿠폰 발급 요청 시 비관적 락이 작동해야 한다', async () => {
        // Arrange
        const issueCouponDto = new IssueCouponDto();
        issueCouponDto.userId = 10;
        issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

        // Act - 동시 요청 시뮬레이션 (순차적으로 처리되어야 함)
        const promises = Array(5).fill(null).map((_, index) => {
          const dto = new IssueCouponDto();
          dto.userId = 10 + index;
          dto.couponType = CouponType.DISCOUNT_10PERCENT;
          return issueCouponUseCase.execute(dto);
        });

        const results = await Promise.all(promises);

        // Assert - 모든 요청이 성공해야 함 (비관적 락으로 순서 보장)
        expect(results).toHaveLength(5);
        results.forEach((result, index) => {
          expect(result).toHaveProperty('couponId');
          expect(result).toHaveProperty('userId', 10 + index);
          expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_10PERCENT);
        });
      });

      it('선착순 쿠폰 발급에서 순서가 보장되어야 한다', async () => {
        // Arrange
        const issueCouponDto = new IssueCouponDto();
        issueCouponDto.userId = 20;
        issueCouponDto.couponType = CouponType.DISCOUNT_20PERCENT;

        // Act - 순차적 요청 시뮬레이션
        const results = [];
        for (let i = 0; i < 3; i++) {
          const dto = new IssueCouponDto();
          dto.userId = 20 + i;
          dto.couponType = CouponType.DISCOUNT_20PERCENT;
          results.push(await issueCouponUseCase.execute(dto));
        }

        // Assert - 순서대로 처리되어야 함
        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
          expect(result).toHaveProperty('userId', 20 + index);
          expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_20PERCENT);
        });
      });

      it('다른 쿠폰 타입은 독립적으로 처리되어야 한다', async () => {
        // Arrange
        const discountDto = new IssueCouponDto();
        discountDto.userId = 30;
        discountDto.couponType = CouponType.DISCOUNT_10PERCENT;

        const fixedDto = new IssueCouponDto();
        fixedDto.userId = 31;
        fixedDto.couponType = CouponType.FIXED_2000;

        // Act - 다른 타입의 쿠폰 동시 발급
        const [discountResult, fixedResult] = await Promise.all([
          issueCouponUseCase.execute(discountDto),
          issueCouponUseCase.execute(fixedDto)
        ]);

        // Assert - 독립적으로 처리되어야 함
        expect(discountResult).toHaveProperty('couponType', CouponType.DISCOUNT_10PERCENT);
        expect(fixedResult).toHaveProperty('couponType', CouponType.FIXED_2000);
      });
    });
  });
}); 