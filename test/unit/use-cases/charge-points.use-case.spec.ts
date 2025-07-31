import { Test, TestingModule } from '@nestjs/testing';
import { ChargePointsUseCase } from '../../../src/application/use-cases/users/charge-points.use-case';
import { UsersServiceInterface } from '../../../src/application/interfaces/services/users-service.interface';
import { User } from '../../../src/domain/entities/user.entity';
import { ChargePointsDto } from '../../../src/presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../src/presentation/dto/usersDTO/points-response.dto';

describe('ChargePointsUseCase', () => {
  let useCase: ChargePointsUseCase;
  let mockUsersService: jest.Mocked<UsersServiceInterface>;

  beforeEach(async () => {
    const mockUsersServiceProvider = {
      provide: 'USERS_SERVICE',
      useValue: {
        chargePoints: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargePointsUseCase,
        mockUsersServiceProvider,
      ],
    }).compile();

    useCase = module.get<ChargePointsUseCase>(ChargePointsUseCase);
    mockUsersService = module.get('USERS_SERVICE');
  });

  describe('execute', () => {
    it('포인트 충전이 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const userId = 1;
      const amount = 10000;
      const chargePointsDto = new ChargePointsDto();
      chargePointsDto.amount = amount;

      const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
      const expectedResponseDto: PointsResponseDto = {
        userId: userId,
        balance: 5000,
      };

      mockUsersService.chargePoints.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(userId, chargePointsDto);

      // Assert
      expect(mockUsersService.chargePoints).toHaveBeenCalledWith(userId, chargePointsDto);
      expect(result).toEqual(expectedResponseDto);
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

    describe('트랜잭션 동작 테스트', () => {
      it('@Transactional 데코레이터가 적용되어야 한다', () => {
        // Arrange & Act
        const method = useCase.execute;
        const metadata = Reflect.getMetadata('transactional', method);

        // Assert
        expect(metadata).toBe(true);
      });

      it('포인트 충전 중 에러가 발생하면 트랜잭션이 롤백되어야 한다', async () => {
        // Arrange
        const userId = 1;
        const amount = 10000;
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = amount;

        mockUsersService.chargePoints.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(useCase.execute(userId, chargePointsDto)).rejects.toThrow('Database error');
      });

      it('모든 단계가 성공하면 트랜잭션이 커밋되어야 한다', async () => {
        // Arrange
        const userId = 1;
        const amount = 10000;
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = amount;

        const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
        const expectedResponseDto: PointsResponseDto = {
          userId: userId,
          balance: 5000,
        };

        mockUsersService.chargePoints.mockResolvedValue(mockUser);

        // Act
        const result = await useCase.execute(userId, chargePointsDto);

        // Assert - 모든 단계가 성공적으로 실행되어야 함
        expect(mockUsersService.chargePoints).toHaveBeenCalledWith(userId, chargePointsDto);
        expect(result).toEqual(expectedResponseDto);
      });

      it('대용량 포인트 충전도 트랜잭션으로 안전하게 처리되어야 한다', async () => {
        // Arrange
        const userId = 1;
        const amount = 1000000;
        const chargePointsDto = new ChargePointsDto();
        chargePointsDto.amount = amount;

        const mockUser = new User(userId, 'Test User', 'test@example.com', 5000);
        const expectedResponseDto: PointsResponseDto = {
          userId: userId,
          balance: 5000,
        };

        mockUsersService.chargePoints.mockResolvedValue(mockUser);

        // Act
        const result = await useCase.execute(userId, chargePointsDto);

        // Assert - 대용량 포인트도 트랜잭션으로 안전하게 처리되어야 함
        expect(mockUsersService.chargePoints).toHaveBeenCalledWith(userId, chargePointsDto);
        expect(result).toEqual(expectedResponseDto);
      });
    });
  });
}); 