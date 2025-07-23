import { Order, OrderItem } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Coupon } from '../entities/coupon.entity';

export class OrderValidationService {
  
  /**
   * 주문 상품 검증
   */
  validateOrderItems(items: any[]): void {
    if (!items || items.length === 0) {
      throw new Error('주문 상품이 필요합니다.');
    }
    
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        throw new Error('상품 ID와 수량은 필수입니다.');
      }
      
      if (item.quantity <= 0) {
        throw new Error('수량은 1개 이상이어야 합니다.');
      }
    }
  }

  /**
   * 상품 존재 여부 및 재고 검증
   */
  validateProduct(product: Product, quantity: number): void {
    if (!product) {
      throw new Error('상품을 찾을 수 없습니다.');
    }
    
    if (!product.hasStock(quantity)) {
      throw new Error(`상품 ${product.name}의 재고가 부족합니다.`);
    }
  }

  /**
   * 쿠폰 유효성 검증
   */
  validateCoupon(coupon: Coupon | null): void {
    if (coupon && !coupon.isValid()) {
      throw new Error('유효하지 않은 쿠폰입니다.');
    }
  }

  /**
   * 사용자 포인트 검증
   */
  validateUserPoints(user: User, finalAmount: number): void {
    if (!user.hasEnoughPoints(finalAmount)) {
      throw new Error('포인트가 부족합니다.');
    }
  }

  /**
   * 주문 금액 검증
   */
  validateOrderAmount(totalAmount: number, finalAmount: number): void {
    if (totalAmount <= 0) {
      throw new Error('주문 금액은 0원보다 커야 합니다.');
    }
    
    if (finalAmount < 0) {
      throw new Error('최종 금액은 음수일 수 없습니다.');
    }
  }

  /**
   * 전체 주문 검증
   */
  validateOrder(
    items: any[],
    products: Product[],
    user: User,
    coupon: Coupon | null,
    totalAmount: number,
    finalAmount: number
  ): void {
    // 주문 상품 검증
    this.validateOrderItems(items);
    
    // 각 상품 검증
    for (let i = 0; i < items.length; i++) {
      this.validateProduct(products[i], items[i].quantity);
    }
    
    // 쿠폰 검증
    this.validateCoupon(coupon);
    
    // 사용자 포인트 검증
    this.validateUserPoints(user, finalAmount);
    
    // 주문 금액 검증
    this.validateOrderAmount(totalAmount, finalAmount);
  }
} 