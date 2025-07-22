import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { ChargePointsDto } from '../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface } from '../../application/interfaces/services/users-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';

@Injectable()
export class UsersService implements UsersServiceInterface {
  
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    const { amount } = chargePointsDto;
    
    // 정책 검증 (최소, 최대 금액)
    if (amount < 1000 || amount > 1000000) {
      throw new BadRequestException('포인트 충전 금액은 1,000원 ~ 1,000,000원 사이여야 합니다.');
    }
    
    // 사용자 조회
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    // 도메인 엔티티의 비즈니스 로직 사용
    user.chargePoints(amount);
    
    // 저장
    const updatedUser = await this.userRepository.save(user);
    
    return {
      userId: updatedUser.id,
      balance: updatedUser.points
    };
  }

  async getUserPoints(userId: number): Promise<PointsResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    return {
      userId: user.id,
      balance: user.points
    };
  }
} 