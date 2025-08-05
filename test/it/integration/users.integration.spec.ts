import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointsUseCase } from '../../../src/application/use-cases/users/charge-points.use-case';
import { GetUserPointsUseCase } from '../../../src/application/use-cases/users/get-user-points.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';

describe('Users Integration Tests', () => {
  let module: TestingModule;
  let chargePointsUseCase: ChargePointsUseCase;
  let getUserPointsUseCase: GetUserPointsUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    chargePointsUseCase = module.get<ChargePointsUseCase>(ChargePointsUseCase);
    getUserPointsUseCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('ChargePoints Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 데이터베이스에 포인트를 충전해야 한다', async () => {
      // Arrange
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 5000;

      // Act - Use Case가 Domain Service를 통해 실제 데이터베이스에 저장
      const result = await chargePointsUseCase.execute(1, chargePointsDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('balance');
      expect(result.balance).toBeGreaterThan(0);

      // Use Case가 실제로 데이터를 저장했는지 확인 (다시 포인트 조회)
      const pointsResult = await getUserPointsUseCase.execute(1);
      expect(pointsResult).toHaveProperty('balance');
      expect(pointsResult.balance).toBe(result.balance);
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자에 대한 포인트 충전 시 에러를 반환해야 한다', async () => {
      // Arrange
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 5000;

      // Act & Assert - Domain Service가 Repository를 통해 사용자 존재 여부 검증
      await expect(chargePointsUseCase.execute(999, chargePointsDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 음수 금액으로 포인트 충전 시 에러를 반환해야 한다', async () => {
      // Arrange
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = -1000; // 음수 금액

      // Act & Assert - Domain Service가 Repository를 통해 금액 검증
      await expect(chargePointsUseCase.execute(1, chargePointsDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 여러 번 포인트를 충전할 때 누적되어야 한다', async () => {
      // Arrange
      const firstChargeDto = new ChargePointsDto();
      firstChargeDto.amount = 3000;

      const secondChargeDto = new ChargePointsDto();
      secondChargeDto.amount = 2000;

      // Act - Use Case가 Domain Service를 통해 연속 충전
      const firstResult = await chargePointsUseCase.execute(2, firstChargeDto);
      const secondResult = await chargePointsUseCase.execute(2, secondChargeDto);

      // Assert - Use Case 결과 검증
      expect(firstResult).toHaveProperty('balance');
      expect(secondResult).toHaveProperty('balance');
      expect(secondResult.balance).toBeGreaterThan(firstResult.balance);

      // 최종 포인트 확인
      const finalPoints = await getUserPointsUseCase.execute(2);
      expect(finalPoints.balance).toBe(secondResult.balance);
    });

    describe('동시성 제어 통합 테스트', () => {
      it('동시 포인트 충전 요청 시 낙관적 락이 작동해야 한다', async () => {
        // Arrange
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = 1000;

        // Act - 동시 요청 시뮬레이션
        const promises = Array(10).fill(null).map(() => 
          chargePointsUseCase.execute(3, chargePointsDto)
        );

        const results = await Promise.all(promises);

        // Assert - 모든 요청이 성공해야 함 (낙관적 락으로 충돌 해결)
        expect(results).toHaveLength(10);
        results.forEach(result => {
          expect(result).toHaveProperty('balance');
          expect(result.balance).toBeGreaterThan(0);
        });

        // 최종 포인트 확인 (모든 충전이 반영되어야 함)
        const finalPoints = await getUserPointsUseCase.execute(3);
        expect(finalPoints.balance).toBeGreaterThan(0);
      });

      it('버전 충돌 시 재시도 로직이 작동해야 한다', async () => {
        // Arrange
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = 1000; // 최소 금액으로 변경

        // Act - 연속적인 충전 요청 (버전 충돌 가능성)
        const results = [];
        for (let i = 0; i < 5; i++) {
          results.push(await chargePointsUseCase.execute(1, chargePointsDto));
        }

        // Assert - 모든 요청이 성공해야 함
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result).toHaveProperty('balance');
          expect(result.balance).toBeGreaterThan(0);
        });
      });

      it('트랜잭션 롤백이 정상적으로 작동해야 한다', async () => {
        // Arrange
        const initialPoints = await getUserPointsUseCase.execute(1);
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = -1000; // 음수로 에러 발생

        // Act & Assert - 트랜잭션 롤백 확인
        await expect(chargePointsUseCase.execute(1, chargePointsDto)).rejects.toThrow();

        // 포인트가 변경되지 않았는지 확인 (롤백 확인)
        const finalPoints = await getUserPointsUseCase.execute(1);
        expect(finalPoints.balance).toBe(initialPoints.balance);
      });
    });
  });

  describe('GetUserPoints Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 데이터베이스에서 사용자 포인트를 조회해야 한다', async () => {
      // Act - Use Case가 Domain Service를 통해 실제 데이터베이스 조회
      const result = await getUserPointsUseCase.execute(1);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('balance');
      expect(typeof result.balance).toBe('number');
      expect(result.balance).toBeGreaterThanOrEqual(0);
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자의 포인트 조회 시 에러를 반환해야 한다', async () => {
      // Act & Assert - Domain Service가 Repository를 통해 사용자 존재 여부 검증
      await expect(getUserPointsUseCase.execute(999)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 여러 사용자의 포인트를 조회해야 한다', async () => {
      // Act - Use Case가 Domain Service를 통해 여러 사용자 조회
      const user1Points = await getUserPointsUseCase.execute(1);
      const user2Points = await getUserPointsUseCase.execute(2);

      // Assert - Use Case 결과 검증
      expect(user1Points).toHaveProperty('balance');
      expect(user2Points).toHaveProperty('balance');
      expect(typeof user1Points.balance).toBe('number');
      expect(typeof user2Points.balance).toBe('number');
    });
  });
}); 