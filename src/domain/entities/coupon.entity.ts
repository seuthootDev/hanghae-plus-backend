export enum CouponType {
  DISCOUNT_10PERCENT = 'DISCOUNT_10PERCENT',
  DISCOUNT_20PERCENT = 'DISCOUNT_20PERCENT',
  DISCOUNT_30PERCENT = 'DISCOUNT_30PERCENT',
  FIXED_1000 = 'FIXED_1000',
  FIXED_2000 = 'FIXED_2000',
  LIMITED_OFFER = 'LIMITED_OFFER'
}

export class Coupon {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly couponType: CouponType,
    public readonly discountRate: number,
    public readonly discountAmount: number = 0,
    public readonly expiryDate: Date,
    private _isUsed: boolean = false
  ) {}

  // Getter 메서드
  get isUsed(): boolean {
    return this._isUsed;
  }

  // 쿠폰 관련 비즈니스 로직
  use(): void {
    this._isUsed = true;
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  isValid(): boolean {
    return !this._isUsed && !this.isExpired();
  }

  calculateDiscount(totalAmount: number): number {
    if (!this.isValid()) {
      return 0;
    }

    if (this.discountRate > 0) {
      return Math.floor(totalAmount * (this.discountRate / 100));
    } else {
      return this.discountAmount;
    }
  }
} 