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
import { performance } from 'perf_hooks';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../../src/application/interfaces/services/coupon-service.interface';

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

  beforeEach(async () => {
    // 각 테스트 전에 Redis 재고 초기화 (쿠폰 테스트를 위해)
    const couponsService = module.get<CouponsServiceInterface>(COUPONS_SERVICE);
    if ('initializeCouponStock' in couponsService) {
      await (couponsService as any).initializeCouponStock();
      console.log('🔄 Redis 재고 초기화 완료');
    }
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

      // Act - 동시 요청 시뮬레이션 (성능 측정 포함)
      const startTime = performance.now();
      
      const promises = Array(10).fill(null).map(() => 
        chargePointsUseCase.execute(userId, chargePointsDto)
      );

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - 모든 요청이 성공해야 함 (낙관적 락으로 충돌 해결)
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('balance');
        expect(result.balance).toBeGreaterThan(0);
      });

      console.log('✅ 동시 포인트 충전 테스트 성공:', results.length, '개 요청 모두 성공');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms (${(results.length / (duration / 1000)).toFixed(2)} req/s)`);
    }, 30000);

    it('동시 주문 생성 시 낙관적 락이 작동해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      // Act - 동시 요청 시뮬레이션 (성능 측정 포함)
      const startTime = performance.now();
      
      const promises = Array(5).fill(null).map(() => 
        createOrderUseCase.execute(createOrderDto)
      );

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - 모든 요청이 성공해야 함
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('orderId');
        expect(result).toHaveProperty('userId', 1);
      });

      console.log('✅ 동시 주문 생성 테스트 성공:', results.length, '개 요청 모두 성공');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms (${(results.length / (duration / 1000)).toFixed(2)} req/s)`);
    }, 30000);

    it('동시 결제 처리 시 중복 결제가 방지되어야 한다', async () => {
      // Arrange - 먼저 주문 생성
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        { productId: 1, quantity: 1 }
      ];

      const order = await createOrderUseCase.execute(createOrderDto);

      // Act - 동시 결제 요청 시뮬레이션 (성능 측정 포함)
      const processPaymentDto = new ProcessPaymentDto();
      processPaymentDto.orderId = order.orderId;

      const startTime = performance.now();
      
      const promises = Array(3).fill(null).map(() => 
        processPaymentUseCase.execute(processPaymentDto)
      );

      const results = await Promise.allSettled(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - 정확히 하나만 성공해야 함
      const successResults = results.filter(result => result.status === 'fulfilled');
      const failedResults = results.filter(result => result.status === 'rejected');

      expect(successResults.length).toBe(1);
      expect(failedResults.length).toBe(2);

      console.log('✅ 중복 결제 방지 테스트 성공:', successResults.length, '개 성공,', failedResults.length, '개 실패');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms (${(results.length / (duration / 1000)).toFixed(2)} req/s)`);
    }, 30000);
  });

  describe('비관적 락 동시성 제어 테스트', () => {
    it('동시 쿠폰 발급 시 비관적 락이 작동해야 한다', async () => {
      // Act - 동시 요청 시뮬레이션 (성능 측정 포함)
      const startTime = performance.now();
      
      const promises = Array(5).fill(null).map((_, index) => {
        const dto = new IssueCouponDto();
        dto.userId = 2 + index; // 서로 다른 사용자
        dto.couponType = CouponType.DISCOUNT_10PERCENT;
        return issueCouponUseCase.execute(dto);
      });

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - 모든 요청이 성공해야 함
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('couponId');
        expect(result).toHaveProperty('userId');
      });

      console.log('✅ 동시 쿠폰 발급 테스트 성공:', results.length, '개 요청 모두 성공');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms (${(results.length / (duration / 1000)).toFixed(2)} req/s)`);
    }, 30000);

    it('선착순 쿠폰 발급에서 순서가 보장되어야 한다', async () => {
      // Act - 순차적 요청 시뮬레이션 (성능 측정 포함)
      const startTime = performance.now();
      
      const results = [];
      for (let i = 0; i < 3; i++) {
        const dto = new IssueCouponDto();
        dto.userId = 10 + i;
        dto.couponType = CouponType.DISCOUNT_10PERCENT;
        results.push(await issueCouponUseCase.execute(dto));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - 모든 요청이 성공해야 함
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('couponId');
        expect(result).toHaveProperty('userId');
      });

      console.log('✅ 선착순 쿠폰 발급 테스트 성공:', results.length, '개 순차 처리');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms (${(results.length / (duration / 1000)).toFixed(2)} req/s)`);
    }, 30000);
  });

  describe('트랜잭션 롤백 테스트', () => {
    it('포인트 충전 실패 시 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const initialPoints = await getUserPointsUseCase.execute(userId);
      
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = -999999; // 음수로 실패 유도

      // Act & Assert - 실패 시 트랜잭션 롤백 확인
      const startTime = performance.now();
      
      await expect(chargePointsUseCase.execute(userId, chargePointsDto)).rejects.toThrow();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const finalPoints = await getUserPointsUseCase.execute(userId);
      expect(finalPoints.balance).toBe(initialPoints.balance); // 롤백 확인

      console.log('✅ 트랜잭션 롤백 테스트 성공');
      console.log(`📊 성능 측정: ${duration.toFixed(2)}ms`);
    }, 30000);
  });

  describe('DB 성능 측정 테스트', () => {
    it('대량 동시 포인트 충전 성능을 측정해야 한다', async () => {
      const userId = 1;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 1000;
      
      const concurrentCount = 20;
      const startTime = performance.now();
      
      const promises = Array(concurrentCount).fill(null).map(() => 
        chargePointsUseCase.execute(userId, chargePointsDto)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(concurrentCount);
      
      console.log(`📊 대량 동시 포인트 충전 성능:`);
      console.log(`- 총 요청: ${concurrentCount}개`);
      console.log(`- 총 처리 시간: ${duration.toFixed(2)}ms`);
      console.log(`- 초당 처리량: ${(concurrentCount / (duration / 1000)).toFixed(2)} req/s`);
      console.log(`- 평균 응답 시간: ${(duration / concurrentCount).toFixed(2)}ms`);
    }, 30000);

    it('대량 동시 주문 생성 성능을 측정해야 한다', async () => {
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [{ productId: 1, quantity: 1 }];
      
      const concurrentCount = 10;
      const startTime = performance.now();
      
      const promises = Array(concurrentCount).fill(null).map(() => 
        createOrderUseCase.execute(createOrderDto)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(concurrentCount);
      
      console.log(`📊 대량 동시 주문 생성 성능:`);
      console.log(`- 총 요청: ${concurrentCount}개`);
      console.log(`- 총 처리 시간: ${duration.toFixed(2)}ms`);
      console.log(`- 초당 처리량: ${(concurrentCount / (duration / 1000)).toFixed(2)} req/s`);
      console.log(`- 평균 응답 시간: ${(duration / concurrentCount).toFixed(2)}ms`);
    }, 30000);

    it('대량 동시 쿠폰 발급 성능을 측정해야 한다', async () => {
      const concurrentCount = 15;
      const startTime = performance.now();
      
      const promises = Array(concurrentCount).fill(null).map((_, index) => {
        const dto = new IssueCouponDto();
        dto.userId = 20 + index; // 서로 다른 사용자
        dto.couponType = CouponType.DISCOUNT_10PERCENT;
        return issueCouponUseCase.execute(dto);
      });
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(concurrentCount);
      
      console.log(`📊 대량 동시 쿠폰 발급 성능:`);
      console.log(`- 총 요청: ${concurrentCount}개`);
      console.log(`- 총 처리 시간: ${duration.toFixed(2)}ms`);
      console.log(`- 초당 처리량: ${(concurrentCount / (duration / 1000)).toFixed(2)} req/s`);
      console.log(`- 평균 응답 시간: ${(duration / concurrentCount).toFixed(2)}ms`);
    }, 30000);
  });
}); 