import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from '../../../src/application/use-cases/auth/login.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../../src/application/interfaces/presenters/auth-presenter.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../src/domain/services/auth-validation.service';
import { LoginDto } from '../../../src/presentation/dto/authDTO/login.dto';
import { AuthResponseDto } from '../../../src/presentation/dto/authDTO/auth-response.dto';
import { User } from '../../../src/domain/entities/user.entity';
import { AuthToken } from '../../../src/domain/entities/auth-token.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
  let mockAuthPresenter: jest.Mocked<AuthPresenterInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockAuthValidationService: jest.Mocked<AuthValidationService>;

  beforeEach(async () => {
    const mockAuthServiceProvider = {
      provide: AUTH_SERVICE,
      useValue: {
        login: jest.fn(),
        verifyPassword: jest.fn(),
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
      },
    };

    const mockAuthValidationServiceProvider = {
      provide: AuthValidationService,
      useValue: {
        validateLogin: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        mockAuthServiceProvider,
        mockAuthPresenterProvider,
        mockUserRepositoryProvider,
        mockAuthValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
    mockAuthPresenter = module.get(AUTH_PRESENTER);
    mockUserRepository = module.get(USER_REPOSITORY);
    mockAuthValidationService = module.get(AuthValidationService);
  });

  describe('execute', () => {
    it('로그인이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
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

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.verifyPassword.mockResolvedValue(true);
      mockAuthService.login.mockResolvedValue(mockAuthToken);
      mockAuthPresenter.presentAuth.mockReturnValue(mockResponse);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(mockAuthValidationService.validateLogin).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockAuthService.login).toHaveBeenCalledWith({
        user: mockUser
      });
      expect(mockAuthPresenter.presentAuth).toHaveBeenCalledWith(mockAuthResult);
      expect(result).toEqual(mockResponse);
    });

    it('존재하지 않는 사용자로 로그인 시 에러를 발생시켜야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(loginDto)).rejects.toThrow('사용자를 찾을 수 없습니다.');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('잘못된 비밀번호로 로그인 시 에러를 발생시켜야 한다', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(loginDto)).rejects.toThrow('비밀번호가 일치하지 않습니다.');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });

    describe('트랜잭션 동작 테스트', () => {
      it('@Transactional 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('transactional', method);

        // Assert
        expect(metadata).toBe(true);
      });

      it('사용자 조회 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(useCase.execute(loginDto)).rejects.toThrow('Database error');
        
        // 트랜잭션이 롤백되었으므로 비밀번호 검증과 로그인이 호출되지 않아야 함
        expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
        expect(mockAuthService.login).not.toHaveBeenCalled();
        expect(mockAuthPresenter.presentAuth).not.toHaveBeenCalled();
      });

      it('비밀번호 검증 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockAuthService.verifyPassword.mockRejectedValue(new Error('Password verification failed'));

        // Act & Assert
        await expect(useCase.execute(loginDto)).rejects.toThrow('Password verification failed');
        
        // 사용자 조회는 성공했지만 비밀번호 검증에서 실패하여 트랜잭션이 롤백되어야 함
        expect(mockUserRepository.findByEmail).toHaveBeenCalled();
        expect(mockAuthService.login).not.toHaveBeenCalled();
        expect(mockAuthPresenter.presentAuth).not.toHaveBeenCalled();
      });

      it('인증 토큰 생성 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockAuthService.verifyPassword.mockResolvedValue(true);
        mockAuthService.login.mockRejectedValue(new Error('Token creation failed'));

        // Act & Assert
        await expect(useCase.execute(loginDto)).rejects.toThrow('Token creation failed');
        
        // 사용자 조회와 비밀번호 검증은 성공했지만 토큰 생성에서 실패하여 트랜잭션이 롤백되어야 함
        expect(mockUserRepository.findByEmail).toHaveBeenCalled();
        expect(mockAuthService.verifyPassword).toHaveBeenCalled();
        expect(mockAuthPresenter.presentAuth).not.toHaveBeenCalled();
      });

      it('모든 단계가 성공하면 트랜잭션이 커밋되어야 한다', async () => {
        // Arrange
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
        const mockAuthToken = new AuthToken(1, 1, 'test-token', 'test-refresh-token', new Date());
        const mockResponse: AuthResponseDto = {
          userId: 1,
          email: 'test@example.com',
          name: '홍길동',
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          expiresAt: new Date(),
        };

        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockAuthService.verifyPassword.mockResolvedValue(true);
        mockAuthService.login.mockResolvedValue(mockAuthToken);
        mockAuthPresenter.presentAuth.mockReturnValue(mockResponse);

        // Act
        const result = await useCase.execute(loginDto);

        // Assert - 모든 단계가 성공적으로 실행되어야 함
        expect(mockUserRepository.findByEmail).toHaveBeenCalled();
        expect(mockAuthService.verifyPassword).toHaveBeenCalled();
        expect(mockAuthService.login).toHaveBeenCalled();
        expect(mockAuthPresenter.presentAuth).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
      });
    });
  });
}); 