import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../../../presentation/dto/authDTO/register.dto';
import { AuthResponseDto } from '../../../presentation/dto/authDTO/auth-response.dto';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../domain/services/auth-validation.service';
import { User } from '../../../domain/entities/user.entity';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly authValidationService: AuthValidationService
  ) {}

  @Transactional()
  @OptimisticLock({
    key: 'register:${args[0].email}',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '회원가입 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;
    
    try {
      // 1. 입력 데이터 검증
      this.authValidationService.validateRegistration(email, password, name);
      
      // 2. 이메일 중복 확인
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      
      // 3. 비밀번호 암호화
      const hashedPassword = await this.authService.hashPassword(password);
      
      // 4. 사용자 생성
      const user = new User(0, name, email, 0, hashedPassword);
      const savedUser = await this.userRepository.save(user);
      
      // 5. 인증 토큰 생성
      const authToken = await this.authService.register({
        email,
        password,
        name,
        hashedPassword,
        userId: savedUser.id
      });
      
      // 6. 응답 생성
      return {
        userId: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        token: authToken.token,
        refreshToken: authToken.refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
      };
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('이메일은 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('비밀번호는 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('이름은 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('이메일 형식이 올바르지 않습니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('비밀번호는 최소 6자 이상이어야 합니다')) {
        throw new BadRequestException(error.message);
      }
      
      // 기타 예외는 그대로 전파
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || '회원가입 중 오류가 발생했습니다.');
    }
  }
} 