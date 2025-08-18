import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPointsUseCase } from '../../../src/application/use-cases/users/get-user-points.use-case';
import { UsersServiceInterface, USERS_SERVICE } from '../../../src/application/interfaces/services/user-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../../src/application/interfaces/services/redis-service.interface';
import { User } from '../../../src/domain/entities/user.entity';
import { PointsResponseDto } from '../../../src/presentation/dto/usersDTO/points-response.dto';
import { createMockRedisService } from '../../helpers/redis-mock.helper';

describe('GetUserPointsUseCase', () => {
  let useCase: GetUserPointsUseCase;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;
  let mockRedisService: jest.Mocked<RedisServiceInterface>;

  beforeEach(async () => {
    const mockUsersServiceProvider = {
      provide: USERS_SERVICE,
      useValue: {
        getUserPoints: jest.fn(),
      },
    };

    const mockRedisServiceProvider = {
      provide: REDIS_SERVICE,
      useValue: createMockRedisService(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPointsUseCase,
        mockUsersServiceProvider,
        mockRedisServiceProvider,
      ],
    }).compile();

    useCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase);
    mockUsersService = module.get(USERS_SERVICE);
    mockRedisService = module.get(REDIS_SERVICE);
  });

  describe('execute', () => {
    it('Redis 캐시에서 사용자 포인트를 조회해야 한다', async () => {
      // Arrange
      const userId = 1;
      const cachedPoints = 5000;
      const expectedResponseDto: PointsResponseDto = {
        userId: userId,
        balance: cachedPoints,
      };

      mockRedisService.getUserPointsCache.mockResolvedValue(cachedPoints);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toEqual(expectedResponseDto);
      expect(mockRedisService.getUserPointsCache).toHaveBeenCalledWith(userId);
      expect(mockUsersService.getUserPoints).not.toHaveBeenCalled();
    });

    it('캐시가 없을 때 DB에서 사용자 포인트를 조회하고 캐시에 저장해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const expectedResponseDto: PointsResponseDto = {
        userId: userId,
        balance: 5000,
      };

      mockRedisService.getUserPointsCache.mockResolvedValue(null);
      mockUsersService.getUserPoints.mockResolvedValue(mockUser);
      mockRedisService.setUserPointsCache.mockResolvedValue();

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toEqual(expectedResponseDto);
      expect(mockRedisService.getUserPointsCache).toHaveBeenCalledWith(userId);
      expect(mockUsersService.getUserPoints).toHaveBeenCalledWith(userId);
      expect(mockRedisService.setUserPointsCache).toHaveBeenCalledWith(userId, 5000, 300);
    });

    it('Redis 캐시 조회 실패 시 DB에서 조회해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const expectedResponseDto: PointsResponseDto = {
        userId: userId,
        balance: 5000,
      };

      // Redis 캐시 조회 실패 시뮬레이션
      mockRedisService.getUserPointsCache.mockRejectedValue(new Error('Redis 연결 실패'));
      mockUsersService.getUserPoints.mockResolvedValue(mockUser);
      mockRedisService.setUserPointsCache.mockResolvedValue();

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toEqual(expectedResponseDto);
      expect(mockUsersService.getUserPoints).toHaveBeenCalledWith(userId);
      expect(mockRedisService.setUserPointsCache).toHaveBeenCalledWith(userId, 5000, 300);
    });

    it('Redis 캐시 저장 실패 시에도 결과를 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const expectedResponseDto: PointsResponseDto = {
        userId: userId,
        balance: 5000,
      };

      mockRedisService.getUserPointsCache.mockResolvedValue(null);
      mockUsersService.getUserPoints.mockResolvedValue(mockUser);
      mockRedisService.setUserPointsCache.mockRejectedValue(new Error('Redis 저장 실패'));

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toEqual(expectedResponseDto);
      expect(mockUsersService.getUserPoints).toHaveBeenCalledWith(userId);
      expect(mockRedisService.setUserPointsCache).toHaveBeenCalledWith(userId, 5000, 300);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockError = new Error('사용자를 찾을 수 없습니다.');
      mockRedisService.getUserPointsCache.mockResolvedValue(null);
      mockUsersService.getUserPoints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow(
        '사용자 포인트를 조회할 수 없습니다.'
      );
    });
  });
}); 