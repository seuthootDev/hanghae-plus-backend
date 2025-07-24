import { Injectable, Inject, BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthServiceInterface, AuthResult } from '../../application/interfaces/services/auth-service.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { AuthRepositoryInterface, AUTH_REPOSITORY } from '../../application/interfaces/repositories/auth-repository.interface';
import { AuthValidationService } from '../../domain/services/auth-validation.service';
import { User } from '../../domain/entities/user.entity';
import { AuthToken } from '../../domain/entities/auth-token.entity';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'hanghae-plus-secret'; 
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryInterface,
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryInterface,
    private readonly authValidationService: AuthValidationService
  ) {}

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      this.authValidationService.validateRegistration(email, password, name);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    // 비밀번호 암호화 (실제로는 bcrypt 사용)
    const hashedPassword = await this.hashPassword(password);
    // 사용자 생성
    const user = new User(0, name, email, 0, hashedPassword);
    const savedUser = await this.userRepository.save(user);
    // JWT 토큰 생성
    const token = this.generateToken(savedUser.id, savedUser.email);
    const refreshToken = this.generateRefreshToken(savedUser.id, savedUser.email);
    // 토큰 저장 (JWT 만료시간과 일치)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
    const authToken = new AuthToken(
      0,
      savedUser.id,
      token,
      refreshToken,
      expiresAt
    );
    await this.authRepository.saveToken(authToken);
    return {
      user: savedUser,
      token,
      refreshToken
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      this.authValidationService.validateLogin(email, password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
    // 사용자 조회
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    // 비밀번호 검증 (실제로는 bcrypt.compare 사용)
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
    // 기존 토큰 무효화
    await this.authRepository.revokeAllUserTokens(user.id);
    // JWT 토큰 생성
    const token = this.generateToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);
    // 토큰 저장 (JWT 만료시간과 일치)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
    const authToken = new AuthToken(
      0,
      user.id,
      token,
      refreshToken,
      expiresAt
    );
    await this.authRepository.saveToken(authToken);
    return {
      user,
      token,
      refreshToken
    };
  }

  async validateToken(token: string): Promise<User> {
    try {
      this.authValidationService.validateToken(token);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
    // JWT 검증 및 디코딩
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    // 사용자 조회
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    // 토큰 유효성 확인
    const authToken = await this.authRepository.findByToken(token);
    if (!authToken || !authToken.isValid()) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    return user;
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    // 리프레시 토큰 유효성 확인
    const authToken = await this.authRepository.findByRefreshToken(refreshToken);
    if (!authToken || !authToken.canRefresh()) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
    // JWT 검증 및 디코딩
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
    // 사용자 조회
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    // 기존 토큰 무효화
    await this.authRepository.revokeAllUserTokens(user.id);
    // 새로운 토큰 생성
    const newToken = this.generateToken(user.id, user.email);
    const newRefreshToken = this.generateRefreshToken(user.id, user.email);
    // 새 토큰 저장 (JWT 만료시간과 일치)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
    const newAuthToken = new AuthToken(
      0,
      user.id,
      newToken,
      newRefreshToken,
      expiresAt
    );
    await this.authRepository.saveToken(newAuthToken);
    return {
      user,
      token: newToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(token: string): Promise<void> {
    await this.authRepository.revokeToken(token);
  }

  // 임시 Mock 메서드들 (실제로는 적절한 라이브러리 사용)
  private async hashPassword(password: string): Promise<string> {
    // 실제로는 bcrypt.hash 사용
    return `hashed_${password}`;
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // 실제로는 bcrypt.compare 사용
    return hashedPassword === `hashed_${password}`;
  }

  private generateToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  private generateRefreshToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  }
} 