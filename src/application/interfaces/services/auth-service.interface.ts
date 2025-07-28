import { User } from '../../../domain/entities/user.entity';
import { AuthToken } from '../../../domain/entities/auth-token.entity';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthServiceInterface {
  register(authData: {
    email: string;
    password: string;
    name: string;
    hashedPassword: string;
    user: User;
  }): Promise<AuthToken>;
  
  login(authData: {
    user: User;
  }): Promise<AuthToken>;
  
  validateToken(token: string): Promise<AuthToken>;
  
  refreshToken(refreshToken: string): Promise<AuthToken>;
  
  logout(token: string): Promise<void>;
  
  hashPassword(password: string): Promise<string>;
  
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
} 