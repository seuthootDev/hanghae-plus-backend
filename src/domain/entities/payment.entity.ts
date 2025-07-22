export class Payment {
  constructor(
    public readonly id: number,
    public readonly orderId: number,
    public readonly userId: number,
    private _totalAmount: number,
    private _discountAmount: number,
    private _finalAmount: number,
    private _couponUsed: boolean,
    private _status: string,
    private _paidAt: Date
  ) {}

  // Getter 메서드들
  get totalAmount(): number {
    return this._totalAmount;
  }

  get discountAmount(): number {
    return this._discountAmount;
  }

  get finalAmount(): number {
    return this._finalAmount;
  }

  get couponUsed(): boolean {
    return this._couponUsed;
  }

  get status(): string {
    return this._status;
  }

  get paidAt(): Date {
    return this._paidAt;
  }

  // 결제 관련 비즈니스 로직
  processPayment(): void {
    if (this._status !== 'PENDING') {
      throw new Error('이미 처리된 결제입니다.');
    }
    this._status = 'SUCCESS';
    this._paidAt = new Date();
  }

  cancelPayment(): void {
    if (this._status === 'SUCCESS') {
      this._status = 'CANCELLED';
    }
  }

  isSuccessful(): boolean {
    return this._status === 'SUCCESS';
  }

  isValid(): boolean {
    return this._finalAmount > 0 && this._finalAmount <= this._totalAmount;
  }
} 