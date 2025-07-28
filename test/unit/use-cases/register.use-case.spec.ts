import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUseCase } from '../../../src/application/use-cases/auth/register.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../../src/application/interfaces/presenters/auth-presenter.interface';
import { RegisterDto } from '../../../src/presentation/dto/authDTO/register.dto';
import { AuthResponseDto } from '../../../src/presentation/dto/authDTO/auth-response.dto';
import { User } from '../../../src/domain/entities/user.entity';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
  let mockAuthPresenter: jest.Mocked<AuthPresenterInterface>;

  beforeEach(async () => {
    const mockAuthServiceProvider = {
      provide: AUTH_SERVICE,
      useValue: {
        register: jest.fn(),
      },
    };

    const mockAuthPresenterProvider = {
      provide: AUTH_PRESENTER,
      useValue: {
        presentAuth: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        mockAuthServiceProvider,
        mockAuthPresenterProvider,
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
    mockAuthPresenter = module.get(AUTH_PRESENTER);
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

      mockAuthService.register.mockResolvedValue(mockAuthResult);
      mockAuthPresenter.presentAuth.mockReturnValue(mockResponse);

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name
      );
      expect(mockAuthPresenter.presentAuth).toHaveBeenCalledWith(mockAuthResult);
      expect(result).toEqual(mockResponse);
      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('홍길동');
    });

    it('AuthService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
      };

      const error = new Error('이미 사용 중인 이메일입니다.');
      mockAuthService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(registerDto)).rejects.toThrow('이미 사용 중인 이메일입니다.');
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name
      );
    });
  });
}); 