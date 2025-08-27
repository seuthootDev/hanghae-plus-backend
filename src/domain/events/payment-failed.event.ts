export class PaymentFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: any[],
    public readonly couponId: number | null,
    public readonly failureReason: string,
    public readonly failedAt: Date,
    public readonly isTimeout: boolean // 10분 초과 여부
  ) {}
}
