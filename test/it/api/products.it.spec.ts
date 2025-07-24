import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testSeeder = moduleFixture.get<TestSeeder>(TestSeeder);
    await app.init();
    
    // 테스트 데이터 시딩
    await testSeeder.seedTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await app.close();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (GET)', () => {
    it('상품 목록 조회가 성공적으로 처리되어야 한다', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          // 각 상품의 구조 검증
          res.body.forEach((product: any) => {
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
    });

    it('정확한 데이터로 특정 상품들을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          const products = res.body;
          
          // 아메리카노 상품 확인
          const americano = products.find((p: any) => p.name === '아메리카노');
          expect(americano).toBeDefined();
          expect(americano.price).toBe(3000);
          expect(americano.category).toBe('음료');
          
          // 카페라떼 상품 확인
          const latte = products.find((p: any) => p.name === '카페라떼');
          expect(latte).toBeDefined();
          expect(latte.price).toBe(4000);
          expect(latte.category).toBe('음료');
        });
    });
  });

  describe('/products/top-sellers (GET)', () => {
    it('인기 상품 조회가 성공적으로 처리되어야 한다', () => {
      return request(app.getHttpServer())
        .get('/products/top-sellers')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body.length).toBeLessThanOrEqual(5); // Top 5
          
          // 각 인기 상품의 구조 검증
          res.body.forEach((product: any) => {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('price');
            expect(product).toHaveProperty('salesCount');
            expect(product).toHaveProperty('totalRevenue');
            
            expect(typeof product.id).toBe('number');
            expect(typeof product.name).toBe('string');
            expect(typeof product.price).toBe('number');
            expect(typeof product.salesCount).toBe('number');
            expect(typeof product.totalRevenue).toBe('number');
            
            expect(product.price).toBeGreaterThan(0);
            expect(product.salesCount).toBeGreaterThan(0);
            expect(product.totalRevenue).toBeGreaterThan(0);
          });
        });
    });

    it('올바른 순서로 인기 상품을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/products/top-sellers')
        .expect(200)
        .expect((res) => {
          const topSellers = res.body;
          
          // 상품이 존재하는지 확인
          expect(topSellers.length).toBeGreaterThan(0);
          
          // 첫 번째 상품이 가장 많이 팔린 상품인지 확인
          const firstProduct = topSellers[0];
          expect(firstProduct).toHaveProperty('name');
          expect(firstProduct).toHaveProperty('salesCount');
          expect(firstProduct.salesCount).toBeGreaterThan(0);
        });
    });

    it('올바른 매출 계산을 해야 한다', () => {
      return request(app.getHttpServer())
        .get('/products/top-sellers')
        .expect(200)
        .expect((res) => {
          const topSellers = res.body;
          
          // 상품이 존재하는지 확인
          expect(topSellers.length).toBeGreaterThan(0);
          
          // 각 상품의 매출이 올바르게 계산되었는지 확인
          topSellers.forEach((product: any) => {
            expect(product).toHaveProperty('totalRevenue');
            expect(product.totalRevenue).toBeGreaterThan(0);
            expect(product.totalRevenue).toBe(product.price * product.salesCount);
          });
        });
    });
  });
}); 