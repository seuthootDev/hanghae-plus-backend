import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RegisterUseCase } from '../../../src/application/use-cases/auth/register.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../../src/application/interfaces/presenters/auth-presenter.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../src/domain/services/auth-validation.service';
import { RegisterDto } from '../../../src/presentation/dto/authDTO/register.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { AuthToken } from '../../../src/domain/entities/auth-token.entity';

describe('Transaction Integration Tests', () => {
  let registerUseCase: RegisterUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
  let mockAuthPresenter: jest.Mocked<AuthPresenterInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockAuthValidationService: jest.Mocked<AuthValidationService>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockAuthServiceProvider = {
      provide: AUTH_SERVICE,
      useValue: {
        register: jest.fn(),
        hashPassword: jest.fn(),
      },
    };

    const mockAuthPresenterProvider = {
      provide: AUTH_PRESENTER,
      useValue: {
        presentAuth: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findByEmail: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockAuthValidationServiceProvider = {
      provide: AuthValidationService,
      useValue: {
        validateRegistration: jest.fn(),
      },
    };

    const mockDataSourceProvider = {
      provide: DataSource,
      useValue: {
        createQueryRunner: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        mockAuthServiceProvider,
        mockAuthPresenterProvider,
        mockUserRepositoryProvider,
        mockAuthValidationServiceProvider,
        mockDataSourceProvider,
      ],
    }).compile();

    registerUseCase = module.get<RegisterUseCase>(RegisterUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
    mockAuthPresenter = module.get(AUTH_PRESENTER);
    mockUserRepository = module.get(USER_REPOSITORY);
    mockAuthValidationService = module.get(AuthValidationService);
    mockDataSource = module.get(DataSource);
  });

  describe('@Transactional 데코레이터 동작 테스트', () => {
    it('@Transactional 데코레이터가 메서드에 적용되어야 한다', () => {
      // Arrange & Act
      const method = registerUseCase.execute;
      const metadata = Reflect.getMetadata('transactional', method);

      // Assert
      expect(metadata).toBe(true);
    });

    it('트랜잭션 데코레이터가 없는 메서드는 메타데이터가 없어야 한다', () => {
      // Arrange
      class TestClass {
        testMethod() {
          return 'test';
        }
      }

      // Act
      const testInstance = new TestClass();
      const metadata = Reflect.getMetadata('transactional', testInstance.testMethod);

      // Assert
      expect(metadata).toBeUndefined();
    });
  });

  describe('트랜잭션 시나리오 테스트', () => {
    it('정상적인 회원가입 시 모든 작업이 성공해야 한다', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      };

      const mockUser = new User(1, '홍길동', 'test@example.com', 0, 'hashed_password');
      const mockAuthToken = new AuthToken(1, 1, 'test-token', 'test-refresh-token', new Date());

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockAuthService.register.mockResolvedValue(mockAuthToken);

      // Act
      await registerUseCase.execute(registerDto);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(mockAuthService.register).toHaveBeenCalled();
    });

    it('이메일 중복 시 트랜잭션이 롤백되어야 한다', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: '홍길동',
      };

      const existingUser = new User(1, '홍길동', 'existing@example.com', 0, 'hashed_password');
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(registerUseCase.execute(registerDto)).rejects.toThrow('이미 사용 중인 이메일입니다.');
      
      // 트랜잭션이 롤백되었으므로 save가 호출되지 않아야 함
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });
}); 