import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

    it.each([
      { amount: 500, description: '너무 낮은 금액' },
      { amount: 2000000, description: '너무 높은 금액' },
      { amount: null, description: 'null 값' },
      { amount: -1000, description: '음수 값' }
    ])('잘못된 금액($description)에 대해 400을 반환해야 한다', ({ amount }) => {
      return request(app.getHttpServer())
        .post('/users/1/points')
        .send({ amount })
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