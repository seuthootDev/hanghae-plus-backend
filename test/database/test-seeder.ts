import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../src/infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../../src/infrastructure/repositories/typeorm/product.entity';
import { CouponEntity } from '../../src/infrastructure/repositories/typeorm/coupon.entity';
import { OrderEntity } from '../../src/infrastructure/repositories/typeorm/order.entity';
import { PaymentEntity } from '../../src/infrastructure/repositories/typeorm/payment.entity';

@Injectable()
export class TestSeeder {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async seedTestData(): Promise<void> {
    // 테스트용 사용자 데이터 (빠른 테스트 실행을 위해 하드코딩)
    const users = [
      { name: 'Test User 1', email: 'test1@example.com', password: 'hashed_password123', points: 25000 },
      { name: 'Test User 2', email: 'test2@example.com', password: 'hashed_password123', points: 15000 },
      { name: 'Test User 3', email: 'test3@example.com', password: 'hashed_password123', points: 0 },
    ];

    for (const userData of users) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    }

    // 상품 데이터
    const products = [
      { name: '아메리카노', price: 3000, stock: 100, category: '음료', salesCount: 50, totalRevenue: 150000 },
      { name: '카페라떼', price: 4000, stock: 80, category: '음료', salesCount: 60, totalRevenue: 240000 },
      { name: '카푸치노', price: 4500, stock: 60, category: '음료', salesCount: 30, totalRevenue: 135000 },
      { name: '티라떼', price: 3500, stock: 40, category: '음료', salesCount: 20, totalRevenue: 70000 },
      { name: '에스프레소', price: 2000, stock: 120, category: '음료', salesCount: 10, totalRevenue: 20000 },
    ];

    for (const productData of products) {
      const product = this.productRepository.create(productData);
      await this.productRepository.save(product);
    }

    // 쿠폰 데이터
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const coupons = [
      { userId: 1, couponType: 'DISCOUNT_10PERCENT', discountRate: 10, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { userId: 1, couponType: 'DISCOUNT_20PERCENT', discountRate: 20, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { userId: 2, couponType: 'FIXED_1000', discountRate: 0, discountAmount: 1000, expiryDate: futureDate, isUsed: false },
      { userId: 2, couponType: 'FIXED_2000', discountRate: 0, discountAmount: 2000, expiryDate: futureDate, isUsed: true },
    ];

    for (const couponData of coupons) {
      const coupon = this.couponRepository.create(couponData);
      await this.couponRepository.save(coupon);
    }

    // 주문 데이터
    const orders = [
      { userId: 1, items: [{ productId: 1, quantity: 2, price: 3000 }], totalAmount: 6000, discountAmount: 600, finalAmount: 5400, couponUsed: true, status: 'PENDING' },
      { userId: 2, items: [{ productId: 2, quantity: 3, price: 4000 }], totalAmount: 12000, discountAmount: 0, finalAmount: 12000, couponUsed: false, status: 'PENDING' },
    ];

    for (const orderData of orders) {
      const order = this.orderRepository.create(orderData);
      await this.orderRepository.save(order);
    }

    // 결제 데이터
    const payments = [
      { orderId: 1, userId: 1, totalAmount: 6000, discountAmount: 600, finalAmount: 5400, couponUsed: true, status: 'SUCCESS', paidAt: new Date() },
    ];

    for (const paymentData of payments) {
      const payment = this.paymentRepository.create(paymentData);
      await this.paymentRepository.save(payment);
    }
  }

  async clearTestData(): Promise<void> {
    await this.paymentRepository.clear();
    await this.orderRepository.clear();
    await this.couponRepository.clear();
    await this.productRepository.clear();
    await this.userRepository.clear();
  }
} 