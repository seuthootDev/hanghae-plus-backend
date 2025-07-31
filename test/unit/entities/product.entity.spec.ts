import { Product } from '../../../src/domain/entities/product.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product(1, '테스트 상품', 10000, 100, '음료');
  });

  describe('stock management', () => {
    describe('hasStock', () => {
      it('재고가 충분할 때 true를 반환해야 한다', () => {
        expect(product.hasStock(50)).toBe(true);
      });

      it('재고가 부족할 때 false를 반환해야 한다', () => {
        expect(product.hasStock(150)).toBe(false);
      });

      it('재고와 정확히 같을 때 true를 반환해야 한다', () => {
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

  describe('getters', () => {
    it('stock getter가 현재 재고를 반환해야 한다', () => {
      expect(product.stock).toBe(100);
    });
  });
}); 