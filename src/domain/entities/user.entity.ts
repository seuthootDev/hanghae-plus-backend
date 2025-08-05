export class User {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly email: string,
    private _points: number = 0,
    private _password: string = '',
    private _version: number = 0
  ) {}

  // 인증 관련 비즈니스 로직
  get password(): string {
    return this._password;
  }

  setPassword(password: string): void {
    this._password = password;
  }

  // 포인트 관련 비즈니스 로직
  get points(): number {
    return this._points;
  }

  chargePoints(amount: number): void {
    if (amount < 0) {
      throw new Error('포인트는 음수일 수 없습니다.');
    }
    this._points += amount;
  }

  usePoints(amount: number): void {
    if (amount < 0) {
      throw new Error('포인트는 음수일 수 없습니다.');
    }
    if (amount > this._points) {
      throw new Error('포인트가 부족합니다.');
    }
    this._points -= amount;
  }

  hasEnoughPoints(amount: number): boolean {
    return this._points >= amount;
  }

  // 버전 관련 메서드
  get version(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }
} 