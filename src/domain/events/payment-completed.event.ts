export class PaymentCompletedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly products: any[],
    public readonly totalAmount: number,
    public readonly discountAmount: number,
    public readonly finalAmount: number,
    public readonly couponUsed: boolean,
    public readonly paidAt: Date,
    public readonly status: string
  ) {}
}
