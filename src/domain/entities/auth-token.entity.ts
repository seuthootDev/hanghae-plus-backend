export class AuthToken {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly token: string,
    public readonly refreshToken: string,
    public readonly expiresAt: Date,
    private _isRevoked: boolean = false
  ) {}

  // Getter 메서드
  get isRevoked(): boolean {
    return this._isRevoked;
  }

  // 토큰 관련 비즈니스 로직
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this._isRevoked && !this.isExpired();
  }

  revoke(): void {
    this._isRevoked = true;
  }

  canRefresh(): boolean {
    return !this._isRevoked && this.isExpired();
  }
} 