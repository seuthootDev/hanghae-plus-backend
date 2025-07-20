import { Injectable, Inject } from '@nestjs/common';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/users-service.interface';

@Injectable()
export class GetUserPointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface
  ) {}

  async execute(userId: number): Promise<PointsResponseDto> {
    // 서비스 계층을 통해 포인트 조회 처리
    return this.usersService.getUserPoints(userId);
  }
} 