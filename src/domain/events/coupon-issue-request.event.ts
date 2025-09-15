import { CouponType } from '../entities/coupon.entity';

export class CouponIssueRequestEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: number,
    public readonly couponType: CouponType,
    public readonly timestamp: Date,
    public readonly correlationId?: string
  ) {}
}
