import { Product } from '../entities/product.entity';

export const PRODUCT_VALIDATION_SERVICE = 'PRODUCT_VALIDATION_SERVICE';

export class ProductValidationService {
  
  /**
   * 상품 존재 여부 검증
   */
  validateProductExists(product: Product | null): void {
    if (!product) {
      throw new Error('상품을 찾을 수 없습니다.');
    }
  }

  /**
   * 상품 재고 검증
   */
  validateProductStock(product: Product, quantity: number): void {
    if (!product.hasStock(quantity)) {
      throw new Error(`상품 ${product.name}의 재고가 부족합니다.`);
    }
  }

  /**
   * 상품 가격 검증
   */
  validateProductPrice(price: number): void {
    if (price <= 0) {
      throw new Error('상품 가격은 0원보다 커야 합니다.');
    }
  }

  /**
   * 상품 수량 검증
   */
  validateProductQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('상품 수량은 1개 이상이어야 합니다.');
    }
  }

  /**
   * 상품 카테고리 검증
   */
  validateProductCategory(category: string): void {
    const validCategories = ['음료', '음식', '의류', '기타'];
    
    if (!validCategories.includes(category)) {
      throw new Error(`유효하지 않은 상품 카테고리입니다: ${category}`);
    }
  }

  /**
   * 상품 정보 검증
   */
  validateProductInfo(name: string, price: number, stock: number, category: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('상품명은 필수입니다.');
    }
    
    this.validateProductPrice(price);
    this.validateProductQuantity(stock);
    this.validateProductCategory(category);
  }

  /**
   * 상품 구매 가능 여부 검증
   */
  validateProductPurchase(product: Product, quantity: number): void {
    this.validateProductExists(product);
    this.validateProductStock(product!, quantity);
    this.validateProductQuantity(quantity);
  }

  /**
   * 인기 상품 기준 검증
   */
  validateTopSellerCriteria(salesCount: number): boolean {
    return salesCount > 50; // 판매량 50개 이상을 인기상품으로 정의
  }
} 