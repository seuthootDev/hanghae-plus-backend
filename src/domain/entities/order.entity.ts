import { User } from './user.entity';
import { Product } from './product.entity';

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export class Order {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    private _items: OrderItem[],
    private _totalAmount: number,
    private _discountAmount: number = 0,
    private _finalAmount: number,
    private _couponId: number | null = null,
    private _couponUsed: boolean = false,
    private _status: string = 'PENDING'
  ) {}

  // Getter 메서드들
  get items(): OrderItem[] {
    return this._items;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get discountAmount(): number {
    return this._discountAmount;
  }

  get finalAmount(): number {
    return this._finalAmount;
  }

  get couponId(): number | null {
    return this._couponId;
  }

  get couponUsed(): boolean {
    return this._couponUsed;
  }

  get status(): string {
    return this._status;
  }

  // 주문 관련 비즈니스 로직
  applyCoupon(couponId: number): void {
    // 쿠폰 적용 로직
    this._couponId = couponId;
    this._couponUsed = true;
    // 할인 계산 로직은 별도 서비스에서 처리
  }

  calculateDiscount(discountAmount: number): void {
    this._discountAmount = discountAmount;
    this._finalAmount = this._totalAmount - this._discountAmount;
  }

  updateStatus(status: string): void {
    this._status = status;
  }

  isValid(): boolean {
    return this._items.length > 0 && this._finalAmount > 0;
  }
} 