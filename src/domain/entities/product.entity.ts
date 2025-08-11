export class Product {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly price: number,
    private _stock: number,
    public readonly category: string,
    private _version: number = 0
  ) {}

  // Getter 메서드들
  get stock(): number {
    return this._stock;
  }

  // 재고 관련 비즈니스 로직
  hasStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('수량은 음수일 수 없습니다.');
    }
    if (!this.hasStock(quantity)) {
      throw new Error('재고가 부족합니다.');
    }
    this._stock -= quantity;
  }

  increaseStock(quantity: number): void {
    this._stock += quantity;
  }

  // 버전 관련 메서드
  get version(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }
} 