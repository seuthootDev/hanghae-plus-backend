import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class ValidateTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  @Transactional()
  async execute(token: string): Promise<User> {
    try {
      // 1. 토큰 검증 (간소화된 서비스 사용)
      const authToken = await this.authService.validateToken(token);
      
      // 2. 사용자 조회
      const user = await this.userRepository.findById(authToken.userId);
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      
      return user;
    } catch (error) {
      // 기타 예외는 그대로 전파
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
} 