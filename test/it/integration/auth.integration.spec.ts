import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from '../../../src/application/use-cases/auth/login.use-case';
import { RegisterUseCase } from '../../../src/application/use-cases/auth/register.use-case';
import { ValidateTokenUseCase } from '../../../src/application/use-cases/auth/validate-token.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { LoginDto } from '../../../src/presentation/dto/authDTO/login.dto';
import { RegisterDto } from '../../../src/presentation/dto/authDTO/register.dto';

describe('Auth Integration Tests', () => {
  let module: TestingModule;
  let loginUseCase: LoginUseCase;
  let registerUseCase: RegisterUseCase;
  let validateTokenUseCase: ValidateTokenUseCase;
  let testSeeder: TestSeeder;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
    registerUseCase = module.get<RegisterUseCase>(RegisterUseCase);
    validateTokenUseCase = module.get<ValidateTokenUseCase>(ValidateTokenUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedTestData();
  });

  afterAll(async () => {
    await testSeeder.clearTestData();
    await module.close();
  });

  describe('Register Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 데이터베이스에 사용자를 등록해야 한다', async () => {
      // Arrange
      const registerDto = new RegisterDto();
      registerDto.email = 'integration-test@example.com';
      registerDto.password = 'password123';
      registerDto.name = '통합테스트사용자';

      // Act - Use Case가 Domain Service를 통해 실제 데이터베이스에 저장
      const result = await registerUseCase.execute(registerDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', 'integration-test@example.com');
      expect(result).toHaveProperty('name', '통합테스트사용자');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');

      // Use Case가 실제로 데이터를 저장했는지 확인 (다시 로그인 시도)
      const loginDto = new LoginDto();
      loginDto.email = 'integration-test@example.com';
      loginDto.password = 'password123';

      const loginResult = await loginUseCase.execute(loginDto);
      expect(loginResult).toHaveProperty('userId');
      expect(loginResult).toHaveProperty('email', 'integration-test@example.com');
    });

    it('Domain Service가 Repository를 통해 중복 이메일 검증을 수행해야 한다', async () => {
      // Arrange
      const registerDto = new RegisterDto();
      registerDto.email = 'test1@example.com'; // 이미 존재하는 이메일
      registerDto.password = 'password123';
      registerDto.name = '중복사용자';

      // Act & Assert - Domain Service가 Repository를 통해 중복 검증을 수행
      await expect(registerUseCase.execute(registerDto)).rejects.toThrow();
    });
  });

  describe('Login Integration', () => {
    it('Use Case가 Domain Service를 통해 실제 사용자로 로그인해야 한다', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'test1@example.com';
      loginDto.password = 'password123';

      // Act - Use Case가 Domain Service를 통해 실제 사용자 검증
      const result = await loginUseCase.execute(loginDto);

      // Assert - Use Case 결과 검증
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', 'test1@example.com');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
    });

    it('Domain Service가 Repository를 통해 잘못된 비밀번호를 검증해야 한다', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'test1@example.com';
      loginDto.password = 'wrongpassword';

      // Act & Assert - Domain Service가 Repository를 통해 비밀번호 검증
      await expect(loginUseCase.execute(loginDto)).rejects.toThrow();
    });

    it('Domain Service가 Repository를 통해 존재하지 않는 사용자를 검증해야 한다', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'nonexistent@example.com';
      loginDto.password = 'password123';

      // Act & Assert - Domain Service가 Repository를 통해 사용자 존재 여부 검증
      await expect(loginUseCase.execute(loginDto)).rejects.toThrow();
    });
  });

  describe('ValidateTokenUseCase + AuthService Integration', () => {
    it('Use Case가 Domain Service를 통해 토큰을 검증해야 한다', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'test1@example.com';
      loginDto.password = 'password123';

      const loginResult = await loginUseCase.execute(loginDto);
      const token = loginResult.token;

      // Act - Use Case가 Domain Service를 통해 토큰 검증
      const result = await validateTokenUseCase.execute(token);

      // Assert - Use Case 결과 검증 (User 엔티티 반환)
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'test1@example.com');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('points');
    });

    it('Domain Service가 유효하지 않은 토큰을 검증해야 한다', async () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act & Assert - Domain Service가 토큰 검증
      await expect(validateTokenUseCase.execute(invalidToken)).rejects.toThrow();
    });
  });
}); 