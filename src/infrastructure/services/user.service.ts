import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ChargePointsDto } from '../../presentation/dto/usersDTO/charge-points.dto';
import { UsersServiceInterface } from '../../application/interfaces/services/user-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { UserValidationService } from '../../domain/services/user-validation.service';
import { User } from '../../domain/entities/user.entity';
import { RedisServiceInterface, REDIS_SERVICE } from '../../application/interfaces/services/redis-service.interface';

@Injectable()
export class UsersService implements UsersServiceInterface {
  
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    @Inject('USER_VALIDATION_SERVICE')
    private readonly userValidationService: UserValidationService,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  async chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      
      // 도메인 서비스를 사용한 검증
      this.userValidationService.validateUserExists(user);
      
      // 포인트 충전
      user!.chargePoints(chargePointsDto.amount);
      
      // 사용자 저장
      const savedUser = await this.userRepository.save(user!);
      
      // 포인트 변경 시 캐시 무효화
      try {
        await this.redisService.invalidateUserPointsCache(userId);
        console.log(`✅ 사용자 ${userId} 포인트 캐시 무효화 완료`);
      } catch (cacheError) {
        console.warn(`⚠️ 포인트 캐시 무효화 실패 (사용자 ${userId}):`, cacheError.message);
        // 캐시 무효화 실패해도 포인트 충전은 성공
      }
      
      return savedUser;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
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
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async usePoints(userId: number, amount: number): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      
      // 도메인 서비스를 사용한 검증
      this.userValidationService.validateUserExists(user);
      
      // 포인트 사용
      user!.usePoints(amount);
      
      // 사용자 저장
      const savedUser = await this.userRepository.save(user!);
      
      // 포인트 변경 시 캐시 무효화
      try {
        await this.redisService.invalidateUserPointsCache(userId);
        console.log(`✅ 사용자 ${userId} 포인트 캐시 무효화 완료`);
      } catch (cacheError) {
        console.warn(`⚠️ 포인트 캐시 무효화 실패 (사용자 ${userId}):`, cacheError.message);
        // 캐시 무효화 실패해도 포인트 사용은 성공
      }
      
      return savedUser;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('포인트가 부족합니다')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async findById(userId: number): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
} 