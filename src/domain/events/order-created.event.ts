export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: any[],
    public readonly totalAmount: number,
    public readonly discountAmount: number,
    public readonly finalAmount: number,
    public readonly couponId: number | null,
    public readonly couponUsed: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date // 10분 후 만료
  ) {}
}
