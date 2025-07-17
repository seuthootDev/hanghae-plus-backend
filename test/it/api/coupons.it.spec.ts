import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Coupons API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/coupons/issue (POST)', () => {
    it('should issue coupon successfully', () => {
      const couponData = {
        userId: 1,
        couponType: 'DISCOUNT_10PERCENT'
      };

      return request(app.getHttpServer())
        .post('/coupons/issue')
        .send(couponData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('couponId');
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('couponType', 'DISCOUNT_10PERCENT');
          expect(res.body).toHaveProperty('discountRate');
          expect(res.body).toHaveProperty('expiryDate');
          expect(res.body).toHaveProperty('isUsed');
          
          expect(typeof res.body.couponId).toBe('number');
          expect(typeof res.body.discountRate).toBe('number');
          expect(typeof res.body.expiryDate).toBe('string');
          expect(typeof res.body.isUsed).toBe('boolean');
          
          expect(res.body.discountRate).toBe(10);
          expect(res.body.isUsed).toBe(false);
          
          // 유효기간 검증 (YYYY-MM-DD 형식)
          const expiryDate = new Date(res.body.expiryDate);
          expect(!isNaN(expiryDate.getTime())).toBe(true);
        });
    });

    it('should issue different coupon types', () => {
      const couponTypes = [
        'DISCOUNT_20PERCENT',
        'FIXED_1000',
        'FIXED_2000'
      ];

      return Promise.all(
        couponTypes.map((couponType, index) => {
          const couponData = {
            userId: 2 + index,
            couponType
          };

          return request(app.getHttpServer())
            .post('/coupons/issue')
            .send(couponData)
            .expect(201)
            .expect((res) => {
              expect(res.body).toHaveProperty('couponType', couponType);
              expect(res.body).toHaveProperty('discountRate');
              expect(res.body).toHaveProperty('isUsed', false);
              
              // 할인율 검증
              if (couponType === 'DISCOUNT_20PERCENT') {
                expect(res.body.discountRate).toBe(20);
              } else {
                expect(res.body.discountRate).toBe(0);
              }
            });
        })
      );
    });

    it('should return 400 for invalid coupon type', () => {
      const couponData = {
        userId: 1,
        couponType: 'INVALID_COUPON'
      };

      return request(app.getHttpServer())
        .post('/coupons/issue')
        .send(couponData)
        .expect(400);
    });

    it('should return 400 for exhausted coupon', () => {
      // Mock 서비스에서 소진된 쿠폰 시뮬레이션
      const couponData = {
        userId: 1,
        couponType: 'DISCOUNT_20PERCENT' // 소진된 쿠폰
      };

      return request(app.getHttpServer())
        .post('/coupons/issue')
        .send(couponData)
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      const couponData = {
        userId: 1
        // couponType missing
      };

      return request(app.getHttpServer())
        .post('/coupons/issue')
        .send(couponData)
        .expect(400);
    });
  });

  describe('/coupons/user/:userId (GET)', () => {
    it('should get user coupons successfully', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/1')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          // 각 쿠폰의 구조 검증
          res.body.forEach((coupon: any) => {
            expect(coupon).toHaveProperty('couponId');
            expect(coupon).toHaveProperty('userId', 1);
            expect(coupon).toHaveProperty('couponType');
            expect(coupon).toHaveProperty('discountRate');
            expect(coupon).toHaveProperty('expiryDate');
            expect(coupon).toHaveProperty('isUsed');
            
            expect(typeof coupon.couponId).toBe('number');
            expect(typeof coupon.couponType).toBe('string');
            expect(typeof coupon.discountRate).toBe('number');
            expect(typeof coupon.expiryDate).toBe('string');
            expect(typeof coupon.isUsed).toBe('boolean');
          });
        });
    });

    it('should return specific coupons for user', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/1')
        .expect(200)
        .expect((res) => {
          const coupons = res.body;
          
          // DISCOUNT_10PERCENT 쿠폰 확인
          const discount10 = coupons.find((c: any) => c.couponType === 'DISCOUNT_10PERCENT');
          expect(discount10).toBeDefined();
          expect(discount10.discountRate).toBe(10);
          expect(discount10.isUsed).toBe(false);
          
          // FIXED_1000 쿠폰 확인
          const fixed1000 = coupons.find((c: any) => c.couponType === 'FIXED_1000');
          expect(fixed1000).toBeDefined();
          expect(fixed1000.discountRate).toBe(0);
          expect(fixed1000.isUsed).toBe(true);
          
          // DISCOUNT_20PERCENT 쿠폰 확인
          const discount20 = coupons.find((c: any) => c.couponType === 'DISCOUNT_20PERCENT');
          expect(discount20).toBeDefined();
          expect(discount20.discountRate).toBe(20);
          expect(discount20.isUsed).toBe(false);
        });
    });

    it('should return empty array for user with no coupons', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/999')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return 400 for invalid userId', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/invalid')
        .expect(400);
    });
  });
}); 