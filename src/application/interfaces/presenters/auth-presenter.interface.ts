import { AuthResult } from '../services/auth-service.interface';
import { AuthResponseDto } from '../../../presentation/dto/authDTO/auth-response.dto';

export const AUTH_PRESENTER = 'AUTH_PRESENTER';

export interface AuthPresenterInterface {
  presentAuth(authResult: AuthResult): AuthResponseDto;
} 