import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';

describe('Orders API (e2e)', () => {
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

    it('쿠폰과 함께 주문 생성이 성공적으로 처리되어야 한다', async () => {
      // 먼저 쿠폰 발급
      const couponResponse = await request(app.getHttpServer())
        .post('/coupons/issue')
        .send({
          userId: 1,
          couponType: 'DISCOUNT_10PERCENT'
        })
        .expect(201);

      const orderData = {
        userId: 1,
        items: [
          {
            productId: 1,
            quantity: 2
          }
        ],
        couponId: couponResponse.body.couponId
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
        userId: 1, // 포인트가 10000원인 사용자 사용
        items: [
          {
            productId: 1,
            quantity: 2
          },
          {
            productId: 2,
            quantity: 1
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
          expect(res.body.items).toHaveLength(2);
          
          // 총 금액 계산 검증: (2×3000) + (1×4000) = 10000
          expect(res.body.totalAmount).toBe(10000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(10000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('PENDING');
          
          // 각 상품의 수량 확인
          const item1 = res.body.items.find((item: any) => item.productId === 1);
          const item2 = res.body.items.find((item: any) => item.productId === 2);
          expect(item1.quantity).toBe(2);
          expect(item2.quantity).toBe(1);
        });
    });

    it('다양한 수량의 여러 상품으로 주문을 생성할 수 있어야 한다', () => {
      const orderData = {
        userId: 1, // 포인트가 10000원인 사용자 사용
        items: [
          {
            productId: 1,
            quantity: 1
          },
          {
            productId: 2,
            quantity: 1
          },
          {
            productId: 5,
            quantity: 1
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
          expect(res.body.items).toHaveLength(3);
          
          // 총 금액 계산 검증: (1×3000) + (1×4000) + (1×2000) = 9000
          expect(res.body.totalAmount).toBe(9000);
          expect(res.body.discountAmount).toBe(0);
          expect(res.body.finalAmount).toBe(9000);
          expect(res.body.couponUsed).toBe(false);
          expect(res.body.status).toBe('PENDING');
          
          // 각 상품의 수량 확인
          const item1 = res.body.items.find((item: any) => item.productId === 1);
          const item2 = res.body.items.find((item: any) => item.productId === 2);
          const item5 = res.body.items.find((item: any) => item.productId === 5);
          expect(item1.quantity).toBe(1);
          expect(item2.quantity).toBe(1);
          expect(item5.quantity).toBe(1);
        });
    });



    it.each([
      {
        orderData: {
          userId: 1,
          items: [{ productId: 999, quantity: 1 }]
        },
        description: '존재하지 않는 상품',
        expectedStatus: 404
      },
      {
        orderData: { userId: 1 },
        description: '필수 필드 누락',
        expectedStatus: 400
      },
      {
        orderData: {
          userId: 1,
          items: [{ productId: 1 }]
        },
        description: '잘못된 상품 구조',
        expectedStatus: 400
      }
    ])('$description에 대해 $expectedStatus을 반환해야 한다', ({ orderData, expectedStatus }) => {
      return request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(expectedStatus);
    });
  });
}); 