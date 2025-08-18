import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/infrastructure/services/user.service';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { User } from '../../../src/domain/entities/user.entity';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';
import { createMockRedisService } from '../../helpers/redis-mock.helper';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockUserValidationServiceProvider = {
      provide: 'USER_VALIDATION_SERVICE',
      useValue: {
        validateUserExists: jest.fn(),
      },
    };

    const mockRedisServiceProvider = {
      provide: REDIS_SERVICE,
      useValue: createMockRedisService(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        mockUserRepositoryProvider,
        mockUserValidationServiceProvider,
        mockRedisServiceProvider,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserRepository = module.get(USER_REPOSITORY);
    mockUserValidationService = module.get('USER_VALIDATION_SERVICE');
    mockRedisService = module.get(REDIS_SERVICE);
  });

  describe('chargePoints', () => {
    it('포인트 충전이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 10000;

      const mockUser = new User(1, 'test', 'test@example.com', 5000, 'password', 0);
      const updatedUser = new User(1, 'test', 'test@example.com', 15000, 'password', 0);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);
      mockUserValidationService.validateUserExists.mockImplementation(() => {});
      mockRedisService.invalidateUserPointsCache.mockResolvedValue();

      // Act
      const result = await service.chargePoints(userId, chargePointsDto);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(mockRedisService.invalidateUserPointsCache).toHaveBeenCalledWith(userId);
    });

    it('사용자가 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const userId = 999;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 10000;

      mockUserRepository.findById.mockResolvedValue(null);
      mockUserValidationService.validateUserExists.mockImplementation(() => {
        throw new Error('사용자를 찾을 수 없습니다.');
      });

      // Act & Assert
      await expect(service.chargePoints(userId, chargePointsDto)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });

  describe('getUserPoints', () => {
    it('사용자 포인트를 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(1, 'test', 'test@example.com', 5000, 'password', 0);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserValidationService.validateUserExists.mockImplementation(() => {});

      // Act
      const result = await service.getUserPoints(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
    });

    it('사용자가 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const userId = 999;

      mockUserRepository.findById.mockResolvedValue(null);
      mockUserValidationService.validateUserExists.mockImplementation(() => {
        throw new Error('사용자를 찾을 수 없습니다.');
      });

      // Act & Assert
      await expect(service.getUserPoints(userId)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });

  describe('validateUser', () => {
    it('사용자 검증이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(1, 'test', 'test@example.com', 5000, 'password', 0);

      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('사용자가 존재하지 않으면 에러를 던져야 한다', async () => {
      // Arrange
      const userId = 999;

      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser(userId)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });

  describe('usePoints', () => {
    it('포인트 사용이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 1000;

      const mockUser = new User(1, 'test', 'test@example.com', 5000, 'password', 0);
      const updatedUser = new User(1, 'test', 'test@example.com', 4000, 'password', 0);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);
      mockUserValidationService.validateUserExists.mockImplementation(() => {});
      mockRedisService.invalidateUserPointsCache.mockResolvedValue();

      // Act
      const result = await service.usePoints(userId, amount);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(mockRedisService.invalidateUserPointsCache).toHaveBeenCalledWith(userId);
    });

    it('포인트가 부족하면 에러를 던져야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 10000;

      const mockUser = new User(1, 'test', 'test@example.com', 5000, 'password', 0);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserValidationService.validateUserExists.mockImplementation(() => {});

      // Act & Assert
      await expect(service.usePoints(userId, amount)).rejects.toThrow('포인트가 부족합니다.');
    });
  });
}); 