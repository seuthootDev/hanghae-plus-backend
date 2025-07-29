import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { LoginDto } from '../../../presentation/dto/authDTO/login.dto';
import { AuthResponseDto } from '../../../presentation/dto/authDTO/auth-response.dto';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../interfaces/presenters/auth-presenter.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { AuthValidationService } from '../../../domain/services/auth-validation.service';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface,
    @Inject(AUTH_PRESENTER)
    private readonly authPresenter: AuthPresenterInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly authValidationService: AuthValidationService
  ) {}

  @Transactional()
  async execute(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    try {
      // 1. 입력 데이터 검증
      this.authValidationService.validateLogin(email, password);
      
      // 2. 사용자 조회
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      
      // 3. 비밀번호 검증
      const isValid = await this.authService.verifyPassword(password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
      
      // 4. 인증 토큰 생성
      const authToken = await this.authService.login({
        userId: user.id,
        email: user.email
      });
      
      // 5. 응답 생성 (다른 프레젠터들과 일관된 패턴)
      return this.authPresenter.presentAuth(
        user,
        authToken.token,
        authToken.refreshToken
      );
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('이메일은 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('비밀번호는 필수입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('이메일 형식이 올바르지 않습니다')) {
        throw new BadRequestException(error.message);
      }
      
      // 기타 예외는 그대로 전파
      if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || '로그인 중 오류가 발생했습니다.');
    }
  }
} 