import { User } from '../../../domain/entities/user.entity';
import { AuthToken } from '../../../domain/entities/auth-token.entity';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthServiceInterface {
  register(email: string, password: string, name: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  validateToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  logout(token: string): Promise<void>;
} 