import { Injectable, Inject } from '@nestjs/common';
import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/user-service.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';

@Injectable()
export class ChargePointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface
  ) {}

  @Transactional()
  @OptimisticLock({
    key: 'user:${args[0]}',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '포인트 충전 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    // 인터셉터가 자동으로 Redis 락과 낙관적 락을 처리
    const updatedUser = await this.usersService.chargePoints(userId, chargePointsDto);
    
    return {
      userId: updatedUser.id,
      balance: updatedUser.points
    };
  }
} 