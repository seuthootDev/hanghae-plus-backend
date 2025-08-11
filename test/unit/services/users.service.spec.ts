import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/infrastructure/services/users.service';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../../src/application/interfaces/repositories/user-repository.interface';
import { UserValidationService } from '../../../src/domain/services/user-validation.service';
import { User } from '../../../src/domain/entities/user.entity';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockUserValidationService: jest.Mocked<UserValidationService>;

  beforeEach(async () => {
    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        updatePoints: jest.fn(),
      },
    };

    const mockUserValidationServiceProvider = {
      provide: UserValidationService,
      useValue: {
        validateChargePoints: jest.fn(),
        validateUserExists: jest.fn(),
        validateUsePoints: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        mockUserRepositoryProvider,
        mockUserValidationServiceProvider,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserRepository = module.get('USER_REPOSITORY');
    mockUserValidationService = module.get(UserValidationService);
  });

  describe('chargePoints', () => {
    it('포인트 충전이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = 10000;

      const mockUser = new User(userId, 'test@example.com', 'password', 5000);
      const updatedUser = new User(userId, 'test@example.com', 'password', 15000);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.chargePoints(userId, chargePointsDto);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateChargePoints).toHaveBeenCalledWith(mockUser, 10000);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('getUserPoints', () => {
    it('사용자 포인트 정보를 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'test@example.com', 'password', 5000);

      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserPoints(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('validateUser', () => {
    it('사용자 검증이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'test@example.com', 'password', 5000);

      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(userId);

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
      await expect(service.validateUser(userId)).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });

  describe('usePoints', () => {
    it('포인트 사용이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 1000;
      const mockUser = new User(userId, 'test@example.com', 'password', 5000);
      const updatedUser = new User(userId, 'test@example.com', 'password', 4000);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.usePoints(userId, amount);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserValidationService.validateUserExists).toHaveBeenCalledWith(mockUser);
      expect(mockUserValidationService.validateUsePoints).toHaveBeenCalledWith(mockUser, amount);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('포인트가 부족하면 에러를 던져야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 10000;
      const mockUser = new User(userId, 'test@example.com', 'password', 5000);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserValidationService.validateUsePoints.mockImplementation(() => {
        throw new Error('포인트가 부족합니다.');
      });

      // Act & Assert
      await expect(service.usePoints(userId, amount)).rejects.toThrow('포인트가 부족합니다.');
    });
  });

  describe('findById', () => {
    it('사용자를 성공적으로 찾아야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'test@example.com', 'password', 5000);

      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('사용자가 존재하지 않으면 null을 반환해야 한다', async () => {
      // Arrange
      const userId = 999;

      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('사용자를 성공적으로 저장해야 한다', async () => {
      // Arrange
      const mockUser = new User(1, 'test@example.com', 'password', 5000);

      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.save(mockUser);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });
}); 