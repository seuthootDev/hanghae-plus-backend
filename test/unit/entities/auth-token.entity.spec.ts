import { AuthToken } from '../../../src/domain/entities/auth-token.entity';

describe('AuthToken Entity', () => {
  let authToken: AuthToken;
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간 전

  beforeEach(() => {
    authToken = new AuthToken(1, 1, 'test-token', 'test-refresh-token', futureDate);
  });

  describe('생성', () => {
    it('올바른 값으로 AuthToken을 생성해야 한다', () => {
      expect(authToken.id).toBe(1);
      expect(authToken.userId).toBe(1);
      expect(authToken.token).toBe('test-token');
      expect(authToken.refreshToken).toBe('test-refresh-token');
      expect(authToken.expiresAt).toEqual(futureDate);
      expect(authToken.isRevoked).toBe(false);
    });

    it('기본값으로 AuthToken을 생성할 수 있어야 한다', () => {
      const defaultToken = new AuthToken(1, 1, 'token', 'refresh', futureDate);
      expect(defaultToken.isRevoked).toBe(false);
    });

    it('revoked 상태로 AuthToken을 생성할 수 있어야 한다', () => {
      const revokedToken = new AuthToken(1, 1, 'token', 'refresh', futureDate, true);
      expect(revokedToken.isRevoked).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('만료되지 않은 토큰은 false를 반환해야 한다', () => {
      expect(authToken.isExpired()).toBe(false);
    });

    it('만료된 토큰은 true를 반환해야 한다', () => {
      const expiredToken = new AuthToken(1, 1, 'token', 'refresh', pastDate);
      expect(expiredToken.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('유효한 토큰은 true를 반환해야 한다', () => {
      expect(authToken.isValid()).toBe(true);
    });

    it('revoked된 토큰은 false를 반환해야 한다', () => {
      const revokedToken = new AuthToken(1, 1, 'token', 'refresh', futureDate, true);
      expect(revokedToken.isValid()).toBe(false);
    });

    it('만료된 토큰은 false를 반환해야 한다', () => {
      const expiredToken = new AuthToken(1, 1, 'token', 'refresh', pastDate);
      expect(expiredToken.isValid()).toBe(false);
    });

    it('revoked되고 만료된 토큰은 false를 반환해야 한다', () => {
      const invalidToken = new AuthToken(1, 1, 'token', 'refresh', pastDate, true);
      expect(invalidToken.isValid()).toBe(false);
    });
  });

  describe('revoke', () => {
    it('토큰을 무효화할 수 있어야 한다', () => {
      expect(authToken.isRevoked).toBe(false);
      authToken.revoke();
      expect(authToken.isRevoked).toBe(true);
    });
  });

  describe('canRefresh', () => {
    it('유효한 토큰은 false를 반환해야 한다', () => {
      expect(authToken.canRefresh()).toBe(false);
    });

    it('만료되었지만 revoked되지 않은 토큰은 true를 반환해야 한다', () => {
      const expiredToken = new AuthToken(1, 1, 'token', 'refresh', pastDate);
      expect(expiredToken.canRefresh()).toBe(true);
    });

    it('revoked된 토큰은 false를 반환해야 한다', () => {
      const revokedToken = new AuthToken(1, 1, 'token', 'refresh', futureDate, true);
      expect(revokedToken.canRefresh()).toBe(false);
    });

    it('revoked되고 만료된 토큰은 false를 반환해야 한다', () => {
      const invalidToken = new AuthToken(1, 1, 'token', 'refresh', pastDate, true);
      expect(invalidToken.canRefresh()).toBe(false);
    });
  });
}); 