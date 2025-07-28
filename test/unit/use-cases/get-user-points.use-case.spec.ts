import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPointsUseCase } from '../../../src/application/use-cases/users/get-user-points.use-case';
import { UsersServiceInterface } from '../../../src/application/interfaces/services/users-service.interface';
import { UserPresenterInterface } from '../../../src/application/interfaces/presenters/user-presenter.interface';
import { User } from '../../../src/domain/entities/user.entity';
import { PointsResponseDto } from '../../../src/presentation/dto/usersDTO/points-response.dto';

describe('GetUserPointsUseCase', () => {
  let useCase: GetUserPointsUseCase;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;
  let mockUserPresenter: jest.Mocked<UserPresenterInterface>;

  beforeEach(async () => {
    const mockUsersServiceProvider = {
      provide: 'USERS_SERVICE',
      useValue: {
        getUserPoints: jest.fn(),
      },
    };

    const mockUserPresenterProvider = {
      provide: 'USER_PRESENTER',
      useValue: {
        presentUserPoints: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPointsUseCase,
        mockUsersServiceProvider,
        mockUserPresenterProvider,
      ],
    }).compile();

    useCase = module.get<GetUserPointsUseCase>(GetUserPointsUseCase);
    mockUsersService = module.get('USERS_SERVICE');
    mockUserPresenter = module.get('USER_PRESENTER');
  });

  describe('execute', () => {
    it('사용자 포인트 조회가 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const mockResponseDto = new PointsResponseDto();
      mockResponseDto.userId = userId;
      mockResponseDto.balance = 5000;

      mockUsersService.getUserPoints.mockResolvedValue(mockUser);
      mockUserPresenter.presentUserPoints.mockReturnValue(mockResponseDto);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(mockUsersService.getUserPoints).toHaveBeenCalledWith(userId);
      expect(mockUserPresenter.presentUserPoints).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockResponseDto);
    });

    it('존재하지 않는 사용자도 처리해야 한다', async () => {
      // Arrange
      const userId = 999;
      const mockUser = new User(userId, 'Non-existent User', 'nonexistent@example.com', 0);
      const mockResponseDto = new PointsResponseDto();
      mockResponseDto.userId = userId;
      mockResponseDto.balance = 0;

      mockUsersService.getUserPoints.mockResolvedValue(mockUser);
      mockUserPresenter.presentUserPoints.mockReturnValue(mockResponseDto);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(mockUsersService.getUserPoints).toHaveBeenCalledWith(userId);
      expect(mockUserPresenter.presentUserPoints).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockResponseDto);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockError = new Error('사용자를 찾을 수 없습니다.');
      mockUsersService.getUserPoints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow(
        '사용자를 찾을 수 없습니다.'
      );
    });
  });
}); 