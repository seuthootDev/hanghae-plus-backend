import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Payments API (e2e)', () => {
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

  describe('/payments/process (POST)', () => {
    it('should process payment successfully', () => {
      const paymentData = {
        orderId: 100
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('paymentId');
          expect(res.body).toHaveProperty('orderId', 100);
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('discountAmount');
          expect(res.body).toHaveProperty('finalAmount');
          expect(res.body).toHaveProperty('couponUsed');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('paidAt');
          
          expect(typeof res.body.paymentId).toBe('number');
          expect(typeof res.body.totalAmount).toBe('number');
          expect(typeof res.body.discountAmount).toBe('number');
          expect(typeof res.body.finalAmount).toBe('number');
          expect(typeof res.body.couponUsed).toBe('boolean');
          expect(typeof res.body.status).toBe('string');
          expect(typeof res.body.paidAt).toBe('string');
          
          // Mock 데이터 검증
          expect(res.body.totalAmount).toBe(6000);
          expect(res.body.discountAmount).toBe(600);
          expect(res.body.finalAmount).toBe(5400);
          expect(res.body.couponUsed).toBe(true);
          expect(res.body.status).toBe('SUCCESS');
        });
    });

    it('should process payment for different order', () => {
      const paymentData = {
        orderId: 101
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('paymentId');
          expect(res.body).toHaveProperty('orderId', 101);
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('discountAmount');
          expect(res.body).toHaveProperty('finalAmount');
          expect(res.body).toHaveProperty('couponUsed');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('paidAt');
          
          // Mock 데이터 검증
          expect(res.body.totalAmount).toBe(12000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(12000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('SUCCESS');
        });
    });

    it('should return 400 for non-existent order', () => {
      const paymentData = {
        orderId: 999
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(400);
    });

    it('should return 400 for insufficient points', () => {
      // Mock 서비스에서 포인트 부족 시나리오를 시뮬레이션
      const paymentData = {
        orderId: 102 // 존재하지 않는 주문 ID로 포인트 부족 시뮬레이션
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(400);
    });

    it('should return 400 for missing orderId', () => {
      const paymentData = {};

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(400);
    });

    it('should return 400 for invalid orderId type', () => {
      const paymentData = {
        orderId: 'invalid'
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(400);
    });

    it('should have valid paidAt timestamp', () => {
      const paymentData = {
        orderId: 100
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('paidAt');
          
          // ISO 8601 날짜 형식 검증
          const paidAt = new Date(res.body.paidAt);
          expect(paidAt instanceof Date).toBe(true);
          expect(!isNaN(paidAt.getTime())).toBe(true);
          
          // 현재 시간과 비교 (1분 이내)
          const now = new Date();
          const diffInMinutes = Math.abs(now.getTime() - paidAt.getTime()) / (1000 * 60);
          expect(diffInMinutes).toBeLessThan(1);
        });
    });
  });
}); 