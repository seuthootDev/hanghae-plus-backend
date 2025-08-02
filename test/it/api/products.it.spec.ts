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
    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
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
            
            expect(typeof product.id).toBe('number');
            expect(typeof product.name).toBe('string');
            expect(typeof product.price).toBe('number');
            
            expect(product.price).toBeGreaterThan(0);
          });
        });
    });

    it('인기 상품을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/products/top-sellers')
        .expect(200)
        .expect((res) => {
          const topSellers = res.body;
          
          // 상품이 존재하는지 확인
          expect(topSellers.length).toBeGreaterThan(0);
          
          // 첫 번째 상품이 존재하는지 확인
          const firstProduct = topSellers[0];
          expect(firstProduct).toHaveProperty('name');
          expect(firstProduct).toHaveProperty('price');
        });
    });
  });
}); 