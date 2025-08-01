import { Injectable, Inject } from '@nestjs/common';
import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/users-service.interface';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class ChargePointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface
  ) {}

  @Transactional()
  async execute(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    // 서비스 계층을 통해 포인트 충전 처리
    const user = await this.usersService.chargePoints(userId, chargePointsDto);
    return {
      userId: user.id,
      balance: user.points
    };
  }
} 