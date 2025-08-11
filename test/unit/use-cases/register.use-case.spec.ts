import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUseCase } from '../../../src/application/use-cases/auth/register.use-case';
import { AuthServiceInterface, AUTH_SERVICE } from '../../../src/application/interfaces/services/auth-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../src/domain/services/auth-validation.service';
import { RegisterDto } from '../../../src/presentation/dto/authDTO/register.dto';
import { AuthResponseDto } from '../../../src/presentation/dto/authDTO/auth-response.dto';
import { User } from '../../../src/domain/entities/user.entity';


describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthService: jest.Mocked<AuthServiceInterface>;
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
        mockUserRepositoryProvider,
        mockAuthValidationServiceProvider,
      ],
    }).compile();

    useCase = module.get<RegisterUseCase>(RegisterUseCase);
    mockAuthService = module.get(AUTH_SERVICE);
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
      const mockAuthResult = { token: 'test-token', refreshToken: 'test-refresh-token' };

      const expectedResponse: AuthResponseDto = {
        userId: 1,
        email: 'test@example.com',
        name: '홍길동',
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresAt: expect.any(Date),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockAuthService.register.mockResolvedValue(mockAuthResult);

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
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        hashedPassword: 'hashed_password',
        userId: mockUser.id
      });
      expect(result).toEqual(expectedResponse);
    });

    describe('데코레이터 적용 테스트', () => {
      it('@OptimisticLock 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('optimistic_lock', method);

        // Assert
        expect(metadata).toBeDefined();
        expect(metadata.key).toBe('register:${args[0].email}');
        expect(metadata.maxRetries).toBe(3);
        expect(metadata.retryDelay).toBe(100);
      });

      it('@Transactional 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('transactional', method);

        // Assert
        expect(metadata).toBe(true);
      });
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

    describe('트랜잭션 동작 테스트', () => {
      it('@Transactional 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('transactional', method);

        // Assert
        expect(metadata).toBe(true);
      });

      it('사용자 저장 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          password: 'password123',
          name: '홍길동',
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockAuthService.hashPassword.mockResolvedValue('hashed_password');
        mockUserRepository.save.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(useCase.execute(registerDto)).rejects.toThrow('Database error');
        
        // 트랜잭션이 롤백되었으므로 register가 호출되지 않아야 함
        expect(mockAuthService.register).not.toHaveBeenCalled();
      });

      it('인증 토큰 생성 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          password: 'password123',
          name: '홍길동',
        };

        const mockUser = new User(1, '홍길동', 'test@example.com', 0, 'hashed_password');

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockAuthService.hashPassword.mockResolvedValue('hashed_password');
        mockUserRepository.save.mockResolvedValue(mockUser);
        mockAuthService.register.mockRejectedValue(new Error('Token creation failed'));

        // Act & Assert
        await expect(useCase.execute(registerDto)).rejects.toThrow('Token creation failed');
        
        // 사용자는 저장되었지만 트랜잭션이 롤백되어야 함
        expect(mockUserRepository.save).toHaveBeenCalled();
      });

      it('모든 단계가 성공하면 트랜잭션이 커밋되어야 한다', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          password: 'password123',
          name: '홍길동',
        };

        const mockUser = new User(1, '홍길동', 'test@example.com', 0, 'hashed_password');
        const mockAuthResult = { token: 'test-token', refreshToken: 'test-refresh-token' };
        const expectedResponse: AuthResponseDto = {
          userId: 1,
          email: 'test@example.com',
          name: '홍길동',
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          expiresAt: expect.any(Date),
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockAuthService.hashPassword.mockResolvedValue('hashed_password');
        mockUserRepository.save.mockResolvedValue(mockUser);
        mockAuthService.register.mockResolvedValue(mockAuthResult);

        // Act
        const result = await useCase.execute(registerDto);

        // Assert - 모든 단계가 성공적으로 실행되어야 함
        expect(mockUserRepository.findByEmail).toHaveBeenCalled();
        expect(mockAuthService.hashPassword).toHaveBeenCalled();
        expect(mockUserRepository.save).toHaveBeenCalled();
        expect(mockAuthService.register).toHaveBeenCalled();
        expect(result).toEqual(expectedResponse);
      });
    });
  });
}); 