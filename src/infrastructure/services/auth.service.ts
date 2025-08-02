import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AuthServiceInterface } from '../../application/interfaces/services/auth-service.interface';
import { AuthValidationService } from '../../domain/services/auth-validation.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { envConfig } from '../../config/env.config';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    private readonly authValidationService: AuthValidationService
  ) {}

  async register(authData: {
    email: string;
    password: string;
    name: string;
    hashedPassword: string;
    userId: number;
  }): Promise<{ token: string; refreshToken: string }> {
    try {
      const token = this.generateToken(authData.userId, authData.email);
      const refreshToken = this.generateRefreshToken(authData.userId, authData.email);
      return { token, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async login(authData: {
    userId: number;
    email: string;
  }): Promise<{ token: string; refreshToken: string }> {
    try {
      const token = this.generateToken(authData.userId, authData.email);
      const refreshToken = this.generateRefreshToken(authData.userId, authData.email);
      return { token, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async validateToken(token: string): Promise<{ userId: number; email: string }> {
    try {
      const payload = jwt.verify(token, envConfig.jwt.secret) as any;
      return { userId: payload.userId, email: payload.email };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, envConfig.jwt.secret) as any;
      const newToken = this.generateToken(payload.userId, payload.email);
      const newRefreshToken = this.generateRefreshToken(payload.userId, payload.email);
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async logout(token: string): Promise<void> {
    // Stateless JWT에서는 서버에서 로그아웃 처리 불필요
    // 클라이언트에서 토큰 삭제로 처리
    return Promise.resolve();
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, envConfig.bcrypt.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private generateToken(userId: number, email: string): string {
    // @ts-ignore - jsonwebtoken 타입 정의 문제로 인한 임시 해결책
    return jwt.sign(
      { userId, email }, 
      envConfig.jwt.secret, 
      { expiresIn: envConfig.jwt.expiresIn }
    );
  }

  private generateRefreshToken(userId: number, email: string): string {
    // @ts-ignore - jsonwebtoken 타입 정의 문제로 인한 임시 해결책
    return jwt.sign(
      { userId, email }, 
      envConfig.jwt.secret, 
      { expiresIn: envConfig.jwt.refreshExpiresIn }
    );
  }
} 