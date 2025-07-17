import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Users API (e2e)', () => {
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

  describe('/users/:userId/points (POST)', () => {
    it('포인트 충전이 성공적으로 처리되어야 한다', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount: 10000 })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('balance');
          expect(typeof res.body.balance).toBe('number');
          expect(res.body.balance).toBeGreaterThan(0);
        });
    });

    it('잘못된 금액(너무 낮음)에 대해 400을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount: 500 })
        .expect(400);
    });

    it('잘못된 금액(너무 높음)에 대해 400을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount: 2000000 })
        .expect(400);
    });

    it('금액이 누락된 경우 400을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({})
        .expect(400);
    });
  });

  describe('/users/:userId/points (GET)', () => {
    it('사용자 포인트 조회가 성공적으로 처리되어야 한다', () => {
      return request(app.getHttpServer())
        .get('/users/1/points')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('balance');
          expect(typeof res.body.balance).toBe('number');
          expect(res.body.balance).toBeGreaterThanOrEqual(0);
        });
    });

    it('다른 사용자의 포인트를 조회할 수 있어야 한다', () => {
      return request(app.getHttpServer())
        .get('/users/2/points')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 2);
          expect(res.body).toHaveProperty('balance');
          expect(typeof res.body.balance).toBe('number');
        });
    });

    it('존재하지 않는 사용자의 경우 잔액 0을 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/users/999/points')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 999);
          expect(res.body).toHaveProperty('balance', 0);
        });
    });
  });
}); 