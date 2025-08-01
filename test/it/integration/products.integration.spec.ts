import { Test, TestingModule } from '@nestjs/testing';
import { TestAppModule } from '../../app.module';
import { GetProductsUseCase } from '../../../src/application/use-cases/products/get-products.use-case';
import { GetTopSellersUseCase } from '../../../src/application/use-cases/products/get-top-sellers.use-case';
import { TestSeeder } from '../../database/test-seeder';

describe('Products Integration Tests', () => {
  let module: TestingModule;
  let getProductsUseCase: GetProductsUseCase;
  let getTopSellersUseCase: GetTopSellersUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    getProductsUseCase = module.get<GetProductsUseCase>(GetProductsUseCase);
    getTopSellersUseCase = module.get<GetTopSellersUseCase>(GetTopSellersUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('GetProducts Integration', () => {
    it('Use Case가 Service와 Repository를 통해 실제 데이터베이스에서 상품을 조회해야 한다', async () => {
      // Act - Use Case가 Service와 Repository를 통해 실제 데이터베이스 조회
      const result = await getProductsUseCase.execute();

      // Assert - Use Case 결과 검증
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // 각 상품의 구조 검증
      result.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('stock');
        expect(product).toHaveProperty('category');

        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price).toBe('number');
        expect(typeof product.stock).toBe('number');
        expect(typeof product.category).toBe('string');

        expect(product.price).toBeGreaterThan(0);
        expect(product.stock).toBeGreaterThanOrEqual(0);
      });
    });

    it('Service가 Repository를 통해 특정 상품들을 조회해야 한다', async () => {
      // Act - Use Case가 Service와 Repository를 통해 조회
      const result = await getProductsUseCase.execute();

      // Assert - Use Case 결과 검증
      const americano = result.find((p) => p.name === '아메리카노');
      expect(americano).toBeDefined();
      expect(americano.price).toBe(3000);
      expect(americano.category).toBe('음료');

      const latte = result.find((p) => p.name === '카페라떼');
      expect(latte).toBeDefined();
      expect(latte.price).toBe(4000);
      expect(latte.category).toBe('음료');
    });
  });

  describe('GetTopSellers', () => {
    it('Use Case가 Service와 Repository를 통해 실제 데이터베이스에서 인기 상품을 조회해야 한다', async () => {
      // Act - Use Case가 Service와 Repository를 통해 실제 데이터베이스 조회
      const result = await getTopSellersUseCase.execute();

      // Assert - Use Case 결과 검증
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5); // Top 5

      // 각 인기 상품의 구조 검증
      result.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');

        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price).toBe('number');

        expect(product.price).toBeGreaterThan(0);
      });
    });

    it('Service가 Repository를 통해 인기 상품을 조회해야 한다', async () => {
      // Act - Use Case가 Service와 Repository를 통해 조회
      const result = await getTopSellersUseCase.execute();

      // Assert - 인기 상품 조회 검증
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
}); 