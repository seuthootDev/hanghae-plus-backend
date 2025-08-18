import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    testSeeder = moduleFixture.get<TestSeeder>(TestSeeder);
    
    // Redis 서비스 가져오기
    const redisService = moduleFixture.get('REDIS_SERVICE');
    const couponsService = moduleFixture.get('COUPONS_SERVICE');
    
    await app.init();
    
    // 테스트 데이터 시딩
    await testSeeder.seedTestData();
    
    // Redis 쿠폰 재고 초기화
    if ('initializeCouponStock' in couponsService) {
      await (couponsService as any).initializeCouponStock();
      console.log('🔄 E2E 테스트: Redis 쿠폰 재고 초기화 완료');
    }
  });

  beforeEach(async () => {
    await testSeeder.clearTestData();
    await testSeeder.seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('회원가입이 성공적으로 처리되어야 한다', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: '새사용자',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'newuser@example.com');
      expect(response.body).toHaveProperty('name', '새사용자');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresAt');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('이미 존재하는 이메일로 회원가입 시 409를 반환해야 한다', async () => {
      const registerDto = {
        email: 'test1@example.com', // 이미 존재하는 이메일
        password: 'password123',
        name: '중복사용자',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('잘못된 이메일 형식에 대해 400을 반환해야 한다', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        name: '테스트',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('8자 미만 비밀번호에 대해 400을 반환해야 한다', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        name: '테스트',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('빈 이름에 대해 400을 반환해야 한다', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('필수 필드가 누락된 경우 400을 반환해야 한다', async () => {
      const registerDto = {
        email: 'test@example.com',
        // password 누락
        name: '테스트',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('로그인이 성공적으로 처리되어야 한다', async () => {
      // 먼저 회원가입
      const registerDto = {
        email: 'loginuser@example.com',
        password: 'password123',
        name: '로그인사용자',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // 로그인
      const loginDto = {
        email: 'loginuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'loginuser@example.com');
      expect(response.body).toHaveProperty('name', '로그인사용자');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresAt');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('기존 테스트 사용자로 로그인이 성공해야 한다', async () => {
      // 시더에서 생성된 테스트 사용자로 로그인
      const loginDto = {
        email: 'test1@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'test1@example.com');
      expect(response.body).toHaveProperty('name', 'Test User 1');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresAt');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('존재하지 않는 사용자로 로그인 시 404를 반환해야 한다', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(404);
    });

    it('잘못된 비밀번호로 로그인 시 401을 반환해야 한다', async () => {
      // 먼저 회원가입
      const registerDto = {
        email: 'wrongpass@example.com',
        password: 'password123',
        name: '비밀번호테스트',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // 잘못된 비밀번호로 로그인
      const loginDto = {
        email: 'wrongpass@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('잘못된 이메일 형식에 대해 400을 반환해야 한다', async () => {
      const loginDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('8자 미만 비밀번호에 대해 400을 반환해야 한다', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('필수 필드가 누락된 경우 400을 반환해야 한다', async () => {
      const loginDto = {
        email: 'test@example.com',
        // password 누락
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('회원가입 후 로그인 플로우', () => {
    it('회원가입 후 동일한 계정으로 로그인이 성공해야 한다', async () => {
      const userData = {
        email: 'flowtest@example.com',
        password: 'password123',
        name: '플로우테스트',
      };

      // 회원가입
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.email).toBe(userData.email);
      expect(registerResponse.body.name).toBe(userData.name);

      // 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.email).toBe(userData.email);
      expect(loginResponse.body.name).toBe(userData.name);
      expect(loginResponse.body.userId).toBe(registerResponse.body.userId);
    });
  });
}); 