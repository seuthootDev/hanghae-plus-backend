export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface AuthServiceInterface {
  /**
   * 회원가입 시 토큰 생성
   */
  register(authData: {
    email: string;
    password: string;
    name: string;
    hashedPassword: string;
    userId: number;
  }): Promise<{ token: string; refreshToken: string }>;

  /**
   * 로그인 시 토큰 생성
   */
  login(authData: {
    userId: number;
    email: string;
  }): Promise<{ token: string; refreshToken: string }>;

  /**
   * 토큰 검증
   */
  validateToken(token: string): Promise<{ userId: number; email: string }>;

  /**
   * 리프레시 토큰으로 새 토큰 생성
   */
  refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }>;

  /**
   * 로그아웃 (stateless JWT에서는 클라이언트에서 처리)
   */
  logout(token: string): Promise<void>;

  /**
   * 비밀번호 해싱
   */
  hashPassword(password: string): Promise<string>;

  /**
   * 비밀번호 검증
   */
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
} 