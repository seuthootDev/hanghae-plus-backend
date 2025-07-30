import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';

describe('Payments API (e2e)', () => {
  let app: INestApplication;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // ValidationPipe 설정
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    testSeeder = moduleFixture.get<TestSeeder>(TestSeeder);
    await app.init();
    
    // 테스트 데이터 시딩 (상품, 주문 데이터 포함)
    await testSeeder.seedFullTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await app.close();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/payments/process (POST)', () => {
    it('결제 처리가 성공적으로 완료되어야 한다', async () => {
      // 먼저 주문 생성
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 2 }]
        })
        .expect(201);

      const paymentData = {
        orderId: orderResponse.body.orderId
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('paymentId');
          expect(res.body).toHaveProperty('orderId', orderResponse.body.orderId);
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
          
          // 실제 데이터 검증
          expect(res.body.totalAmount).toBe(6000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(6000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('SUCCESS');
        });
    });

    it('다른 주문에 대한 결제 처리가 성공적으로 완료되어야 한다', async () => {
      // 먼저 주문 생성
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: 1, // 포인트가 10000원인 사용자 사용
          items: [{ productId: 2, quantity: 1 }] // 4000원 주문으로 수정
        })
        .expect(201);

      const paymentData = {
        orderId: orderResponse.body.orderId
      };

      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('paymentId');
          expect(res.body).toHaveProperty('orderId', orderResponse.body.orderId);
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('discountAmount');
          expect(res.body).toHaveProperty('finalAmount');
          expect(res.body).toHaveProperty('couponUsed');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('paidAt');
          
          // 실제 데이터 검증
          expect(res.body.totalAmount).toBe(4000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(4000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('SUCCESS');
        });
    });

    it.each([
      {
        paymentData: { orderId: 999 },
        description: '존재하지 않는 주문',
        expectedStatus: 404
      },
      {
        paymentData: { orderId: 102 },
        description: '포인트 부족',
        expectedStatus: 404
      },
              {
          paymentData: {},
          description: '주문 ID 누락',
          expectedStatus: 400
        },
      {
        paymentData: { orderId: 'invalid' },
        description: '잘못된 주문 ID 타입',
        expectedStatus: 400
      }
    ])('$description에 대해 $expectedStatus을 반환해야 한다', ({ paymentData, expectedStatus }) => {
      return request(app.getHttpServer())
        .post('/payments/process')
        .send(paymentData)
        .expect(expectedStatus);
    });

    it('유효한 결제 시간 타임스탬프를 가져야 한다', async () => {
      // 먼저 주문 생성
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1 }]
        })
        .expect(201);

      const paymentData = {
        orderId: orderResponse.body.orderId
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
          
          // 현재 시간과 비교 (5분 이내)
          const now = new Date();
          const diffInMinutes = Math.abs(now.getTime() - paidAt.getTime()) / (1000 * 60);
          expect(diffInMinutes).toBeLessThan(5);
        });
    });
  });
}); 