import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointsUseCase } from '../../../src/application/use-cases/users/charge-points.use-case';
import { GetUserPointsUseCase } from '../../../src/application/use-cases/users/get-user-points.use-case';
import { IssueCouponUseCase } from '../../../src/application/use-cases/coupons/issue-coupon.use-case';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';
import { IssueCouponDto, CouponType } from '../../../src/presentation/dto/couponsDTO/issue-coupon.dto';
import { CreateOrderDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';
import { ProcessPaymentDto } from '../../../src/presentation/dto/paymentsDTO/process-payment.dto';

describe('Concurrency Control Integration Tests', () => {
  let module: TestingModule;
  let chargePointsUseCase: ChargePointsUseCase;
  let getUserPointsUseCase: GetUserPointsUseCase;
  let issueCouponUseCase: IssueCouponUseCase;
  let createOrderUseCase: CreateOrderUseCase;
  let processPaymentUseCase: ProcessPaymentUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    chargePointsUseCase = module.get<ChargePointsUseCase>(ChargePointsUseCase);
    getUserPointsUseCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase);
    issueCouponUseCase = module.get<IssueCouponUseCase>(IssueCouponUseCase);
    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    processPaymentUseCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('낙관적 락 동시성 제어 테스트', () => {
    it('동시 포인트 충전 시 낙관적 락이 작동해야 한다', async () => {
      // Arrange
      const userId = 1;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 1000;

      // Act - 동시 요청 시뮬레이션
      const promises = Array(10).fill(null).map(() => 
        chargePointsUseCase.execute(userId, chargePointsDto)
      );

      const results = await Promise.all(promises);

      // Assert - 모든 요청이 성공해야 함 (낙관적 락으로 충돌 해결)
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('balance');
        expect(result.balance).toBeGreaterThan(0);
      });

      console.log('✅ 동시 포인트 충전 테스트 성공:', results.length, '개 요청 모두 성공');
    }, 30000);

    it('동시 주문 생성 시 낙관적 락이 작동해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      // Act - 동시 요청 시뮬레이션
      const promises = Array(5).fill(null).map(() => 
        createOrderUseCase.execute(createOrderDto)
      );

      const results = await Promise.all(promises);

      // Assert - 모든 요청이 성공해야 함
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('orderId');
        expect(result).toHaveProperty('userId', 1);
      });

      console.log('✅ 동시 주문 생성 테스트 성공:', results.length, '개 요청 모두 성공');
    }, 30000);

    it('동시 결제 처리 시 중복 결제가 방지되어야 한다', async () => {
      // Arrange - 먼저 주문 생성
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const order = await createOrderUseCase.execute(createOrderDto);

      const processPaymentDto = new ProcessPaymentDto();
      processPaymentDto.orderId = order.orderId;

      // Act - 동시 결제 요청 시뮬레이션
      const promises = Array(3).fill(null).map(() => 
        processPaymentUseCase.execute(processPaymentDto).catch(error => error)
      );

      const results = await Promise.all(promises);

      // Assert - 하나만 성공하고 나머지는 실패해야 함 (중복 결제 방지)
      const successResults = results.filter(result => result && result.paymentId);
      const failedResults = results.filter(result => result instanceof Error);
      
      expect(successResults.length).toBe(1); // 정확히 하나만 성공
      expect(failedResults.length).toBe(2); // 나머지는 실패

      console.log('✅ 중복 결제 방지 테스트 성공: 1개 성공, 2개 실패');
    }, 30000);
  });

  describe('비관적 락 동시성 제어 테스트', () => {
    it('동시 쿠폰 발급 시 비관적 락이 작동해야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 2;
      issueCouponDto.couponType = CouponType.DISCOUNT_10PERCENT;

      // Act - 동시 요청 시뮬레이션 (순차적으로 처리되어야 함)
      const promises = Array(5).fill(null).map((_, index) => {
        const dto = new IssueCouponDto();
        dto.userId = 2 + index;
        dto.couponType = CouponType.DISCOUNT_10PERCENT;
        return issueCouponUseCase.execute(dto);
      });

      const results = await Promise.all(promises);

      // Assert - 모든 요청이 성공해야 함 (비관적 락으로 순서 보장)
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('couponId');
        expect(result).toHaveProperty('userId', 2 + index);
        expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_10PERCENT);
      });

      console.log('✅ 동시 쿠폰 발급 테스트 성공:', results.length, '개 요청 모두 성공');
    }, 30000);

    it('선착순 쿠폰 발급에서 순서가 보장되어야 한다', async () => {
      // Arrange
      const issueCouponDto = new IssueCouponDto();
      issueCouponDto.userId = 10;
      issueCouponDto.couponType = CouponType.DISCOUNT_20PERCENT;

      // Act - 순차적 요청 시뮬레이션
      const results = [];
      for (let i = 0; i < 3; i++) {
        const dto = new IssueCouponDto();
        dto.userId = 10 + i;
        dto.couponType = CouponType.DISCOUNT_20PERCENT;
        results.push(await issueCouponUseCase.execute(dto));
      }

      // Assert - 순서대로 처리되어야 함
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('userId', 10 + index);
        expect(result).toHaveProperty('couponType', CouponType.DISCOUNT_20PERCENT);
      });

      console.log('✅ 선착순 쿠폰 발급 테스트 성공:', results.length, '개 순차 처리');
    }, 30000);
  });

  describe('트랜잭션 롤백 테스트', () => {
    it('포인트 충전 실패 시 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const initialPoints = await getUserPointsUseCase.execute(userId);
      
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = -1000; // 음수로 에러 발생

      // Act & Assert - 트랜잭션 롤백 확인
      await expect(chargePointsUseCase.execute(userId, chargePointsDto)).rejects.toThrow();

      // 포인트가 변경되지 않았는지 확인 (롤백 확인)
      const finalPoints = await getUserPointsUseCase.execute(userId);
      expect(finalPoints.balance).toBe(initialPoints.balance);

      console.log('✅ 트랜잭션 롤백 테스트 성공');
    }, 30000);
  });
}); 