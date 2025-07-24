import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointsUseCase } from '../../../src/application/use-cases/users/charge-points.use-case';
import { UsersServiceInterface } from '../../../src/application/interfaces/services/users-service.interface';
import { UserPresenterInterface } from '../../../src/application/interfaces/presenters/user-presenter.interface';
import { User } from '../../../src/domain/entities/user.entity';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../src/presentation/dto/usersDTO/points-response.dto';

describe('ChargePointsUseCase', () => {
  let useCase: ChargePointsUseCase;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;
  let mockUserPresenter: jest.Mocked<UserPresenterInterface>;

  beforeEach(async () => {
    const mockUsersServiceProvider = {
      provide: 'USERS_SERVICE',
      useValue: {
        chargePoints: jest.fn(),
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
        ChargePointsUseCase,
        mockUsersServiceProvider,
        mockUserPresenterProvider,
      ],
    }).compile();

    useCase = module.get<ChargePointsUseCase>(ChargePointsUseCase);
    mockUsersService = module.get('USERS_SERVICE');
    mockUserPresenter = module.get('USER_PRESENTER');
  });

  describe('execute', () => {
    it('포인트 충전이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 10000;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = amount;

      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const mockResponseDto = new PointsResponseDto();
      mockResponseDto.userId = userId;
      mockResponseDto.balance = 15000;

      mockUsersService.chargePoints.mockResolvedValue(mockUser);
      mockUserPresenter.presentUserPoints.mockReturnValue(mockResponseDto);

      // Act
      const result = await useCase.execute(userId, chargePointsDto);

      // Assert
      expect(mockUsersService.chargePoints).toHaveBeenCalledWith(userId, chargePointsDto);
      expect(mockUserPresenter.presentUserPoints).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockResponseDto);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = -1000;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = amount;

      const mockError = new Error('포인트는 음수일 수 없습니다.');
      mockUsersService.chargePoints.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(userId, chargePointsDto)).rejects.toThrow(
        '포인트는 음수일 수 없습니다.'
      );
    });
  });
}); 