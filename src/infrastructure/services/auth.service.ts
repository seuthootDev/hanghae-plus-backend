import { Injectable, Inject, BadRequestException, UnauthorizedException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { AuthServiceInterface, AuthResult } from '../../application/interfaces/services/auth-service.interface';
import { AuthRepositoryInterface, AUTH_REPOSITORY } from '../../application/interfaces/repositories/auth-repository.interface';
import { AuthValidationService } from '../../domain/services/auth-validation.service';
import { User } from '../../domain/entities/user.entity';
import { AuthToken } from '../../domain/entities/auth-token.entity';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { envConfig } from '../../config/env.config';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryInterface,
    private readonly authValidationService: AuthValidationService
  ) {}

  async register(authData: {
    email: string;
    password: string;
    name: string;
    hashedPassword: string;
    user: User;
  }): Promise<AuthToken> {
    try {
      // JWT 토큰 생성
      const token = this.generateToken(authData.user.id, authData.user.email);
      const refreshToken = this.generateRefreshToken(authData.user.id, authData.user.email);
      
      // 토큰 저장 (JWT 만료시간과 일치)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
      const authToken = new AuthToken(
        0,
        authData.user.id,
        token,
        refreshToken,
        expiresAt
      );
      
      const savedToken = await this.authRepository.saveToken(authToken);
      return savedToken;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('토큰 데이터가 유효하지 않습니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('토큰 만료일은 현재 시간보다 이후여야 합니다')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async login(authData: {
    user: User;
  }): Promise<AuthToken> {
    try {
      // 기존 토큰 무효화
      await this.authRepository.revokeAllUserTokens(authData.user.id);
      
      // JWT 토큰 생성
      const token = this.generateToken(authData.user.id, authData.user.email);
      const refreshToken = this.generateRefreshToken(authData.user.id, authData.user.email);
      
      // 토큰 저장 (JWT 만료시간과 일치)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
      const authToken = new AuthToken(
        0,
        authData.user.id,
        token,
        refreshToken,
        expiresAt
      );
      
      const savedToken = await this.authRepository.saveToken(authToken);
      return savedToken;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('토큰 데이터가 유효하지 않습니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('토큰 만료일은 현재 시간보다 이후여야 합니다')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async validateToken(token: string): Promise<AuthToken> {
    try {
      // JWT 검증 및 디코딩
      let payload: any;
      try {
        payload = jwt.verify(token, envConfig.jwt.secret);
      } catch (e) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      
      // 토큰 유효성 확인
      const authToken = await this.authRepository.findByToken(token);
      if (!authToken || !authToken.isValid()) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      
      return authToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      // 리프레시 토큰 유효성 확인
      const authToken = await this.authRepository.findByRefreshToken(refreshToken);
      if (!authToken || !authToken.canRefresh()) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }
      
      // JWT 검증 및 디코딩
      let payload: any;
      try {
        payload = jwt.verify(refreshToken, envConfig.jwt.secret);
      } catch (e) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }
      
      // 기존 토큰 무효화
      await this.authRepository.revokeAllUserTokens(authToken.userId);
      
      // 새로운 토큰 생성
      const newToken = this.generateToken(authToken.userId, payload.email);
      const newRefreshToken = this.generateRefreshToken(authToken.userId, payload.email);
      
      // 새 토큰 저장 (JWT 만료시간과 일치)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
      const newAuthToken = new AuthToken(
        0,
        authToken.userId,
        newToken,
        newRefreshToken,
        expiresAt
      );
      
      const savedToken = await this.authRepository.saveToken(newAuthToken);
      return savedToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      await this.authRepository.revokeToken(token);
    } catch (error) {
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  // 실제 bcrypt를 사용한 비밀번호 해싱
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, envConfig.bcrypt.saltRounds);
  }

  // 실제 bcrypt를 사용한 비밀번호 검증
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