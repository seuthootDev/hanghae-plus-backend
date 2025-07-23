export class User {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly email: string,
    private _points: number = 0
  ) {}

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
} 