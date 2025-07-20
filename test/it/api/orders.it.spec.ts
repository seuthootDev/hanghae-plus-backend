import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Orders API (e2e)', () => {
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

  describe('/orders (POST)', () => {
    it('쿠폰 없이 주문 생성이 성공적으로 처리되어야 한다', () => {
      const orderData = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 2
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('orderId');
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('discountAmount');
          expect(res.body).toHaveProperty('finalAmount');
          expect(res.body).toHaveProperty('couponUsed');
          expect(res.body).toHaveProperty('status');
          
          expect(typeof res.body.orderId).toBe('number');
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(typeof res.body.totalAmount).toBe('number');
          expect(typeof res.body.discountAmount).toBe('number');
          expect(typeof res.body.finalAmount).toBe('number');
          expect(typeof res.body.couponUsed).toBe('boolean');
          expect(typeof res.body.status).toBe('string');
          
          // 계산 검증
          expect(res.body.totalAmount).toBe(6000); // 2개 × 3000원
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(6000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('PENDING');
        });
    });

    it('쿠폰과 함께 주문 생성이 성공적으로 처리되어야 한다', () => {
      const orderData = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 2
          }
        ],
        couponId: 10
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('orderId');
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('discountAmount');
          expect(res.body).toHaveProperty('finalAmount');
          expect(res.body).toHaveProperty('couponUsed');
          expect(res.body).toHaveProperty('status');
          
          // 할인 계산 검증 (10% 할인)
          expect(res.body.totalAmount).toBe(6000);
          expect(res.body.discountAmount).toBe(600); // 10% 할인
          expect(res.body.finalAmount).toBe(5400);
          expect(res.body.couponUsed).toBe(true);
          expect(res.body.status).toBe('PENDING');
        });
    });

    it('여러 상품으로 주문을 생성할 수 있어야 한다', () => {
      const orderData = {
        userId: 2,
        items: [
          {
            productId: 1,
            quantity: 1
          },
          {
            productId: 2,
            quantity: 2
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('orderId');
          expect(res.body).toHaveProperty('userId', 2);
          expect(res.body).toHaveProperty('items');
          expect(res.body.items).toHaveLength(2);
          
          // 총 금액 계산 검증: (1×3000) + (2×4000) = 11000
          expect(res.body.totalAmount).toBe(11000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(11000);
        });
    });

    it.each([
      {
        orderData: {
          userId: 1,
          items: [{ productId: 999, quantity: 1 }]
        },
        description: '존재하지 않는 상품'
      },
      {
        orderData: { userId: 1 },
        description: '필수 필드 누락'
      },
      {
        orderData: {
          userId: 1,
          items: [{ productId: 1 }]
        },
        description: '잘못된 상품 구조'
      }
    ])('$description에 대해 400을 반환해야 한다', ({ orderData }) => {
      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(400);
    });
  });
}); 