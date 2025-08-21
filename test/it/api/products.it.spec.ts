import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testSeeder = moduleFixture.get<TestSeeder>(TestSeeder);
    
    // Redis 서비스 가져오기
    const redisService = app.get(REDIS_SERVICE);
    const couponsService = moduleFixture.get('COUPONS_SERVICE');
    
    await app.init();
    
    // 테스트 데이터 시딩
    await testSeeder.seedFullTestData();
    
    // Redis Sorted Set에 초기 상품 랭킹 설정
    const rankingKey = 'product:ranking';
    const initialRankings = [
      { productId: 1, score: 50 }, // 아메리카노: 50개 판매
      { productId: 2, score: 60 }, // 카페라떼: 60개 판매 (1위)
      { productId: 3, score: 30 }, // 카푸치노: 30개 판매
      { productId: 4, score: 20 }, // 티라떼: 20개 판매
      { productId: 5, score: 10 }, // 에스프레소: 10개 판매
    ];

    for (const ranking of initialRankings) {
      await redisService.zadd(rankingKey, ranking.score, ranking.productId.toString());
    }
    
    // 설정된 데이터 확인
    const allRankings = await redisService.zrange(rankingKey, 0, -1, 'WITHSCORES');
    console.log('🔍 Redis Sorted Set 데이터 확인:', allRankings);
    console.log('✅ Redis Sorted Set에 초기 상품 랭킹 설정 완료');
    
    // Redis 쿠폰 재고 초기화
    if ('initializeCouponStock' in couponsService) {
      await (couponsService as any).initializeCouponStock();
      console.log('🔄 E2E 테스트: Redis 쿠폰 재고 초기화 완료');
    }
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