import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ChargePointsDto } from '../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface } from '../../application/interfaces/services/users-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { UserValidationService } from '../../domain/services/user-validation.service';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UsersService implements UsersServiceInterface {
  
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly userValidationService: UserValidationService
  ) {}

  async chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<User> {
    const { amount } = chargePointsDto;
    
    try {
      // 사용자 조회
      const user = await this.userRepository.findById(userId);
      
      // 도메인 서비스를 사용한 검증
      this.userValidationService.validateChargePoints(user, amount);
      
      // 도메인 엔티티의 비즈니스 로직 사용
      user!.chargePoints(amount);
      
      // 저장
      const updatedUser = await this.userRepository.save(user!);
      
      return updatedUser;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('포인트 충전 금액')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('포인트는 음수일 수 없습니다')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async getUserPoints(userId: number): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      
      // 도메인 서비스를 사용한 검증
      this.userValidationService.validateUserExists(user);
      
      return user!;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  // 주문에서 사용할 메서드들
  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    this.userValidationService.validateUserExists(user);
    return user!;
  }

  async usePoints(userId: number, amount: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    this.userValidationService.validateUserExists(user);
    this.userValidationService.validateUsePoints(user!, amount);
    
    user!.usePoints(amount);
    return await this.userRepository.save(user!);
  }

  async findById(userId: number): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
} 