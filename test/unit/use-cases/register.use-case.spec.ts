import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUseCase } from '../../../src/application/use-cases/auth/register.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../../src/application/interfaces/presenters/auth-presenter.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../src/domain/services/auth-validation.service';
import { RegisterDto } from '../../../src/presentation/dto/authDTO/register.dto';
import { AuthResponseDto } from '../../../src/presentation/dto/authDTO/auth-response.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { AuthToken } from '../../../src/domain/entities/auth-token.entity';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
  let mockAuthPresenter: jest.Mocked<AuthPresenterInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockAuthValidationService: jest.Mocked<AuthValidationService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        mockAuthServiceProvider,
        mockAuthPresenterProvider,
        mockUserRepositoryProvider,
        mockAuthValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
    mockAuthPresenter = module.get(AUTH_PRESENTER);
    mockUserRepository = module.get(USER_REPOSITORY);
    mockAuthValidationService = module.get(AuthValidationService);
  });

  describe('execute', () => {
    it('회원가입이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      };

      const mockUser = new User(1, '홍길동', 'test@example.com', 0, 'hashed_password');
      const mockAuthToken = new AuthToken(1, 1, 'test-token', 'test-refresh-token', new Date());
      const mockAuthResult = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
      };

      const mockResponse: AuthResponseDto = {
        userId: 1,
        email: 'test@example.com',
        name: '홍길동',
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockAuthService.register.mockResolvedValue(mockAuthToken);
      mockAuthPresenter.presentAuth.mockReturnValue(mockResponse);

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(mockAuthValidationService.validateRegistration).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        hashedPassword: 'hashed_password',
        user: mockUser
      });
      expect(mockAuthPresenter.presentAuth).toHaveBeenCalledWith(mockAuthResult);
      expect(result).toEqual(mockResponse);
    });

    it('이미 사용 중인 이메일이면 에러를 발생시켜야 한다', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      };

      const existingUser = new User(1, '홍길동', 'test@example.com', 0, 'hashed_password');
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(useCase.execute(registerDto)).rejects.toThrow('이미 사용 중인 이메일입니다.');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });
  });
}); 