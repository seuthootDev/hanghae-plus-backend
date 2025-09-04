import { CouponType } from '../entities/coupon.entity';

export class CouponIssueResponseEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: number,
    public readonly couponType: CouponType,
    public readonly success: boolean,
    public readonly couponId?: number,
    public readonly errorMessage?: string,
    public readonly timestamp: Date = new Date(),
    public readonly correlationId?: string
  ) {}
}
