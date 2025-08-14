import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/user-service.interface';
import { RedisServiceInterface, REDIS_SERVICE } from '../../interfaces/services/redis-service.interface';

@Injectable()
export class GetUserPointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
    @Inject(REDIS_SERVICE)
    private readonly redisService: RedisServiceInterface
  ) {}

  async execute(userId: number): Promise<PointsResponseDto> {
    // Redis 캐시에서 먼저 조회 (에러 처리 포함)
    try {
      const cachedPoints = await this.redisService.getUserPointsCache(userId);
      if (cachedPoints !== null) {
        console.log(`✅ Redis 캐시에서 사용자 ${userId} 포인트 조회 성공`);
        return {
          userId: userId,
          balance: cachedPoints
        };
      }
    } catch (error) {
      console.warn(`⚠️ Redis 캐시 조회 실패 (사용자 ${userId}), DB에서 조회:`, error.message);
    }

    // 캐시가 없거나 실패하면 DB에서 조회
    try {
      const user = await this.usersService.getUserPoints(userId);
      const result = {
        userId: user.id,
        balance: user.points
      };

      // Redis에 캐시 저장 (에러 처리 포함, TTL: 5분)
      try {
        await this.redisService.setUserPointsCache(userId, user.points, 300);
        console.log(`✅ Redis 캐시에 사용자 ${userId} 포인트 저장 성공`);
      } catch (cacheError) {
        console.warn(`⚠️ Redis 캐시 저장 실패 (사용자 ${userId}):`, cacheError.message);
        // 캐시 저장 실패해도 결과는 반환
      }

      return result;
    } catch (error) {
      console.error(`❌ 사용자 ${userId} 포인트 조회 실패:`, error.message);
      
      // NotFoundException은 그대로 전달
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error('사용자 포인트를 조회할 수 없습니다.');
    }
  }
} 