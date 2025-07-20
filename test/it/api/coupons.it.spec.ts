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
    it('쿠폰 발급이 성공적으로 처리되어야 한다', () => {
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

    it.each([
      { couponType: 'FIXED_1000', userId: 2 },
      { couponType: 'FIXED_2000', userId: 3 }
    ])('$couponType 쿠폰을 발급할 수 있어야 한다', ({ couponType, userId }) => {
      const couponData = {
        userId,
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
          expect(res.body.discountRate).toBe(0);
        });
    });

    it('잘못된 쿠폰 타입에 대해 400을 반환해야 한다', () => {
      const couponData = {
        userId: 1,
        couponType: 'INVALID_COUPON'
      };

      return request(app.getHttpServer())
        .post('/coupons/issue')
        .send(couponData)
        .expect(400);
    });

    it('소진된 쿠폰에 대해 400을 반환해야 한다', () => {
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

    it('필수 필드가 누락된 경우 400을 반환해야 한다', () => {
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
    it('사용자 쿠폰 조회가 성공적으로 처리되어야 한다', () => {
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

    it('사용자별 특정 쿠폰을 반환해야 한다', () => {
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

    it('쿠폰이 없는 사용자의 경우 빈 배열을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/999')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('잘못된 사용자 ID에 대해 400을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/coupons/user/invalid')
        .expect(400);
    });
  });
}); 