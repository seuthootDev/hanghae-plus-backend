import { Product } from '../../../src/domain/entities/product.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product(1, 'Test Product', 10000, 100, 'Electronics', 30, 300000);
  });

  describe('stock management', () => {
    describe('hasStock', () => {
      it('충분한 재고가 있을 때 true를 반환해야 한다', () => {
        expect(product.hasStock(50)).toBe(true);
      });

      it('부족한 재고가 있을 때 false를 반환해야 한다', () => {
        expect(product.hasStock(150)).toBe(false);
      });

      it('정확히 같은 재고가 있을 때 true를 반환해야 한다', () => {
        expect(product.hasStock(100)).toBe(true);
      });
    });

    describe('decreaseStock', () => {
      it('재고를 성공적으로 감소시켜야 한다', () => {
        const initialStock = product.stock;
        const decreaseAmount = 20;

        product.decreaseStock(decreaseAmount);

        expect(product.stock).toBe(initialStock - decreaseAmount);
      });

      it('재고보다 많은 수량을 감소시키면 에러를 던져야 한다', () => {
        expect(() => {
          product.decreaseStock(150);
        }).toThrow('재고가 부족합니다.');
      });

      it('음수 수량으로 감소시키면 에러를 던져야 한다', () => {
        expect(() => {
          product.decreaseStock(-10);
        }).toThrow('수량은 음수일 수 없습니다.');
      });
    });

    describe('increaseStock', () => {
      it('재고를 성공적으로 증가시켜야 한다', () => {
        const initialStock = product.stock;
        const increaseAmount = 50;

        product.increaseStock(increaseAmount);

        expect(product.stock).toBe(initialStock + increaseAmount);
      });

      it('음수 수량으로도 증가시킬 수 있어야 한다 (반품 등)', () => {
        const initialStock = product.stock;
        const increaseAmount = -10;

        product.increaseStock(increaseAmount);

        expect(product.stock).toBe(initialStock + increaseAmount);
      });
    });
  });

  describe('sales management', () => {
    describe('addSales', () => {
      it('판매량과 매출을 성공적으로 증가시켜야 한다', () => {
        const initialSalesCount = product.salesCount;
        const initialRevenue = product.totalRevenue;
        const salesQuantity = 5;

        product.addSales(salesQuantity);

        expect(product.salesCount).toBe(initialSalesCount + salesQuantity);
        expect(product.totalRevenue).toBe(initialRevenue + (product.price * salesQuantity));
      });

      it('여러 번 판매해도 누적되어야 한다', () => {
        product.addSales(10);
        product.addSales(5);

        expect(product.salesCount).toBe(45); // 30 + 10 + 5
        expect(product.totalRevenue).toBe(450000); // 300000 + (10000 * 15)
      });
    });

    describe('isTopSeller', () => {
      it('판매량이 50개 초과일 때 true를 반환해야 한다', () => {
        product.addSales(25); // 30 + 25 = 55
        expect(product.isTopSeller()).toBe(true);
      });

      it('판매량이 50개 이하일 때 false를 반환해야 한다', () => {
        expect(product.isTopSeller()).toBe(false);
      });

      it('판매량이 정확히 50개일 때 false를 반환해야 한다', () => {
        product.addSales(20); // 30 + 20 = 50
        expect(product.isTopSeller()).toBe(false);
      });
    });
  });

  describe('getters', () => {
    it('stock getter가 현재 재고를 반환해야 한다', () => {
      expect(product.stock).toBe(100);
    });

    it('salesCount getter가 현재 판매량을 반환해야 한다', () => {
      expect(product.salesCount).toBe(30);
    });

    it('totalRevenue getter가 현재 총 매출을 반환해야 한다', () => {
      expect(product.totalRevenue).toBe(300000);
    });
  });
}); 