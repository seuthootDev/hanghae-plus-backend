export class Product {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly price: number,
    private _stock: number,
    public readonly category: string,
    private _salesCount: number = 0,
    private _totalRevenue: number = 0
  ) {}

  // Getter 메서드들
  get stock(): number {
    return this._stock;
  }

  get salesCount(): number {
    return this._salesCount;
  }

  get totalRevenue(): number {
    return this._totalRevenue;
  }

  // 재고 관련 비즈니스 로직
  hasStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error('재고가 부족합니다.');
    }
    this._stock -= quantity;
  }

  increaseStock(quantity: number): void {
    this._stock += quantity;
  }

  // 판매 관련 비즈니스 로직
  addSales(quantity: number): void {
    this._salesCount += quantity;
    this._totalRevenue += this.price * quantity;
  }

  isTopSeller(): boolean {
    return this._salesCount > 50; // 판매량 50개 이상을 인기상품으로 정의
  }
} 