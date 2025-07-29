import { User } from '../../../domain/entities/user.entity';
import { AuthResponseDto } from '../../../presentation/dto/authDTO/auth-response.dto';

export const AUTH_PRESENTER = 'AUTH_PRESENTER';

export interface AuthPresenterInterface {
  presentAuth(user: User, token: string, refreshToken: string): AuthResponseDto;
} 