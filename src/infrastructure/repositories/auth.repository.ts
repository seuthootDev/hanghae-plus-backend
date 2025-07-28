import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthToken } from '../../domain/entities/auth-token.entity';
import { AuthRepositoryInterface } from '../../application/interfaces/repositories/auth-repository.interface';
import { AuthTokenEntity } from './typeorm/auth-token.entity';

@Injectable()
export class AuthRepository implements AuthRepositoryInterface {
  constructor(
    @InjectRepository(AuthTokenEntity)
    private readonly authTokenRepository: Repository<AuthTokenEntity>
  ) {}

  async saveToken(token: AuthToken): Promise<AuthToken> {
    const tokenEntity = new AuthTokenEntity();
    tokenEntity.userId = token.userId;
    tokenEntity.token = token.token;
    tokenEntity.refreshToken = token.refreshToken;
    tokenEntity.expiresAt = token.expiresAt;
    tokenEntity.isRevoked = token.isRevoked;

    const savedEntity = await this.authTokenRepository.save(tokenEntity);
    
    return new AuthToken(
      savedEntity.id,
      savedEntity.userId,
      savedEntity.token,
      savedEntity.refreshToken,
      savedEntity.expiresAt,
      savedEntity.isRevoked
    );
  }

  async findByToken(token: string): Promise<AuthToken | null> {
    const tokenEntity = await this.authTokenRepository.findOne({ 
      where: { token } 
    });
    
    if (!tokenEntity) return null;
    
    return new AuthToken(
      tokenEntity.id,
      tokenEntity.userId,
      tokenEntity.token,
      tokenEntity.refreshToken,
      tokenEntity.expiresAt,
      tokenEntity.isRevoked
    );
  }

  async findByRefreshToken(refreshToken: string): Promise<AuthToken | null> {
    const tokenEntity = await this.authTokenRepository.findOne({ 
      where: { refreshToken } 
    });
    
    if (!tokenEntity) return null;
    
    return new AuthToken(
      tokenEntity.id,
      tokenEntity.userId,
      tokenEntity.token,
      tokenEntity.refreshToken,
      tokenEntity.expiresAt,
      tokenEntity.isRevoked
    );
  }

  async findByUserId(userId: number): Promise<AuthToken[]> {
    const tokenEntities = await this.authTokenRepository.find({ 
      where: { userId } 
    });
    
    return tokenEntities.map(entity => new AuthToken(
      entity.id,
      entity.userId,
      entity.token,
      entity.refreshToken,
      entity.expiresAt,
      entity.isRevoked
    ));
  }

  async revokeToken(token: string): Promise<void> {
    await this.authTokenRepository.update(
      { token },
      { isRevoked: true }
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.authTokenRepository.update(
      { userId },
      { isRevoked: true }
    );
  }
} 