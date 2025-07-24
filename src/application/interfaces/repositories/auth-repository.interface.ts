import { AuthToken } from '../../../domain/entities/auth-token.entity';

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface AuthRepositoryInterface {
  saveToken(token: AuthToken): Promise<AuthToken>;
  findByToken(token: string): Promise<AuthToken | null>;
  findByRefreshToken(refreshToken: string): Promise<AuthToken | null>;
  findByUserId(userId: number): Promise<AuthToken[]>;
  revokeToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: number): Promise<void>;
} 