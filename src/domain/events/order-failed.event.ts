export class OrderFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: any[],
    public readonly couponId: number | null,
    public readonly failureReason: string,
    public readonly failedAt: Date
  ) {}
}
