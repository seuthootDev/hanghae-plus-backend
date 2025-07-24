import { Injectable } from '@nestjs/common';
import { AuthPresenterInterface } from '../../application/interfaces/presenters/auth-presenter.interface';
import { AuthResult } from '../../application/interfaces/services/auth-service.interface';
import { AuthResponseDto } from '../../presentation/dto/authDTO/auth-response.dto';

@Injectable()
export class AuthPresenter implements AuthPresenterInterface {
  presentAuth(authResult: AuthResult): AuthResponseDto {
    return {
      userId: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
    };
  }
} 