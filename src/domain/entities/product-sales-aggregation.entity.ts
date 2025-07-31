export class ProductSalesAggregation {
  constructor(
    public readonly id: number,
    public readonly productId: number,
    public readonly salesCount: number,
    public readonly totalRevenue: number,
    public readonly lastUpdated: Date
  ) {}

  static create(
    productId: number,
    salesCount: number = 0,
    totalRevenue: number = 0
  ): ProductSalesAggregation {
    return new ProductSalesAggregation(
      0, // id는 DB에서 자동 생성
      productId,
      salesCount,
      totalRevenue,
      new Date()
    );
  }

  updateSales(salesCount: number, totalRevenue: number): ProductSalesAggregation {
    return new ProductSalesAggregation(
      this.id,
      this.productId,
      salesCount,
      totalRevenue,
      new Date()
    );
  }
} 