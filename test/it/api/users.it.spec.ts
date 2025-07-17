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
    it('should charge points successfully', () => {
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

    it('should return 400 for invalid amount (too low)', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount: 500 })
        .expect(400);
    });

    it('should return 400 for invalid amount (too high)', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount: 2000000 })
        .expect(400);
    });

    it('should return 400 for missing amount', () => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({})
        .expect(400);
    });
  });

  describe('/users/:userId/points (GET)', () => {
    it('should get user points successfully', () => {
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

    it('should get different user points', () => {
      return request(app.getHttpServer())
        .get('/users/2/points')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 2);
          expect(res.body).toHaveProperty('balance');
          expect(typeof res.body.balance).toBe('number');
        });
    });

    it('should return 0 balance for non-existent user', () => {
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