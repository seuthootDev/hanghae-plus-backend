import { Injectable } from '@nestjs/common';
import { AuthPresenterInterface } from '../../application/interfaces/presenters/auth-presenter.interface';
import { AuthResponseDto } from '../../presentation/dto/authDTO/auth-response.dto';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class AuthPresenter implements AuthPresenterInterface {
  presentAuth(user: User, token: string, refreshToken: string): AuthResponseDto {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
    };
  }
} 