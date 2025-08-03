import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../src/application/use-cases/orders/create-order.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { CreateOrderDto, OrderItemDto } from '../../../src/presentation/dto/ordersDTO/create-order.dto';

describe('Orders Integration Tests', () => {
  let module: TestingModule;
  let createOrderUseCase: CreateOrderUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('CreateOrder Integration', () => {
    it('Use Case가 Domain Service들을 통해 실제 데이터베이스에 주문을 생성해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        {
          productId: 1,
          quantity: 2
        } as OrderItemDto
      ];
      createOrderDto.couponId = 1;

      // Act - Use Case가 Domain Service들을 통해 실제 데이터베이스에 저장
      const result = await createOrderUseCase.execute(createOrderDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('discountAmount');
      expect(result).toHaveProperty('finalAmount');
      expect(result).toHaveProperty('couponUsed');
      expect(result).toHaveProperty('status', 'PENDING');
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);

      // Use Case가 실제로 데이터를 저장했는지 확인 (다시 같은 주문 생성 시도)
      const duplicateOrderDto = new CreateOrderDto();
      duplicateOrderDto.userId = 1;
      duplicateOrderDto.items = [
        {
          productId: 1,
          quantity: 1
        } as OrderItemDto
      ];

      const duplicateResult = await createOrderUseCase.execute(duplicateOrderDto);
      expect(duplicateResult).toHaveProperty('orderId');
      expect(duplicateResult.orderId).not.toBe(result.orderId); // 다른 주문이 생성되어야 함
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자에 대한 주문 생성 시 에러를 반환해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 999; // 존재하지 않는 사용자
      createOrderDto.items = [
        {
          productId: 1,
          quantity: 1
        } as OrderItemDto
      ];

      // Act & Assert - Domain Service가 Repository를 통해 사용자 존재 여부 검증
      await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 상품에 대한 주문 생성 시 에러를 반환해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        {
          productId: 999, // 존재하지 않는 상품
          quantity: 1
        } as OrderItemDto
      ];

      // Act & Assert - Domain Service가 Repository를 통해 상품 존재 여부 검증
      await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 재고가 부족한 상품에 대한 주문 생성 시 에러를 반환해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        {
          productId: 1,
          quantity: 999 // 재고보다 많은 수량
        } as OrderItemDto
      ];

      // Act & Assert - Domain Service가 Repository를 통해 재고 검증
      await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 쿠폰을 적용한 주문을 생성해야 한다', async () => {
      // Arrange
      const createOrderDto = new CreateOrderDto();
      createOrderDto.userId = 1;
      createOrderDto.items = [
        {
          productId: 1,
          quantity: 1
        } as OrderItemDto
      ];
      createOrderDto.couponId = 1; // 쿠폰 적용

      // Act - Use Case가 Domain Service들을 통해 쿠폰이 적용된 주문 생성
      const result = await createOrderUseCase.execute(createOrderDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('discountAmount');
      expect(result).toHaveProperty('finalAmount');
      expect(result).toHaveProperty('couponUsed');
      expect(result).toHaveProperty('status', 'PENDING');
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
}); 