import { User } from '../entities/user.entity';

export class AuthValidationService {
  
  /**
   * 회원가입 데이터 검증
   */
  validateRegistration(email: string, password: string, name: string): void {
    this.validateEmail(email);
    this.validatePassword(password);
    this.validateName(name);
  }

  /**
   * 로그인 데이터 검증
   */
  validateLogin(email: string, password: string): void {
    this.validateEmail(email);
    this.validatePassword(password);
  }

  /**
   * 이메일 형식 검증
   */
  validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('이메일은 필수입니다.');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('올바른 이메일 형식이 아닙니다.');
    }
  }

  /**
   * 비밀번호 검증
   */
  validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('비밀번호는 8자 이상이어야 합니다.');
    }
    
    if (password.length > 100) {
      throw new Error('비밀번호는 100자 이하여야 합니다.');
    }
  }

  /**
   * 이름 검증
   */
  validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('이름은 필수입니다.');
    }
    
    if (name.length > 50) {
      throw new Error('이름은 50자 이하여야 합니다.');
    }
  }

  /**
   * 사용자 존재 여부 검증
   */
  validateUserExists(user: User | null): void {
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
  }

  /**
   * 비밀번호 일치 여부 검증
   */
  validatePasswordMatch(isValid: boolean): void {
    if (!isValid) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
  }

  /**
   * 이메일 중복 검증
   */
  validateEmailNotExists(existingUser: User | null): void {
    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }
  }

  /**
   * 토큰 유효성 검증
   */
  validateToken(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new Error('토큰은 필수입니다.');
    }
  }
} 