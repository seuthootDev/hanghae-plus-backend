import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from '../../../src/application/use-cases/auth/login.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../../src/application/interfaces/presenters/auth-presenter.interface';
import { LoginDto } from '../../../src/presentation/dto/authDTO/login.dto';
import { AuthResponseDto } from '../../../src/presentation/dto/authDTO/auth-response.dto';
import { User } from '../../../src/domain/entities/user.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
  let mockAuthPresenter: jest.Mocked<AuthPresenterInterface>;

  beforeEach(async () => {
    const mockAuthServiceProvider = {
      provide: AUTH_SERVICE,
      useValue: {
        login: jest.fn(),
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
        LoginUseCase,
        mockAuthServiceProvider,
        mockAuthPresenterProvider,
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
    mockAuthPresenter = module.get(AUTH_PRESENTER);
  });

  describe('execute', () => {
    it('로그인이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
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

      mockAuthService.login.mockResolvedValue(mockAuthResult);
      mockAuthPresenter.presentAuth.mockReturnValue(mockResponse);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthPresenter.presentAuth).toHaveBeenCalledWith(mockAuthResult);
      expect(result).toEqual(mockResponse);
      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('홍길동');
    });

    it('AuthService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('비밀번호가 일치하지 않습니다.');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(loginDto)).rejects.toThrow('비밀번호가 일치하지 않습니다.');
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
    });

    it('존재하지 않는 사용자로 로그인 시 에러를 전파해야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const error = new Error('사용자를 찾을 수 없습니다.');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(loginDto)).rejects.toThrow('사용자를 찾을 수 없습니다.');
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
    });
  });
}); 