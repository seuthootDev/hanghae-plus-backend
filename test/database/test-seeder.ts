import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../src/infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../../src/infrastructure/repositories/typeorm/product.entity';
import { CouponEntity } from '../../src/infrastructure/repositories/typeorm/coupon.entity';
import { OrderEntity } from '../../src/infrastructure/repositories/typeorm/order.entity';
import { PaymentEntity } from '../../src/infrastructure/repositories/typeorm/payment.entity';
import { ProductSalesAggregationEntity } from '../../src/infrastructure/repositories/typeorm/product-sales-aggregation.entity';
import * as bcrypt from 'bcrypt';
import { envConfig } from '../../src/config/env.config';

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
    @InjectRepository(ProductSalesAggregationEntity)
    private readonly aggregationRepository: Repository<ProductSalesAggregationEntity>,
  ) {}

  async seedTestData(): Promise<void> {
    // Auth API 테스트를 위한 기본 사용자 데이터만 삽입
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, envConfig.bcrypt.saltRounds);
    
    const users = [
      { name: 'Test User 1', email: 'test1@example.com', password: hashedPassword, points: 25000 },
      { name: 'Test User 2', email: 'test2@example.com', password: hashedPassword, points: 15000 },
      { name: 'Test User 3', email: 'test3@example.com', password: hashedPassword, points: 0 },
    ];

    // 사용자 데이터만 삽입 (Auth API 테스트에만 필요)
    for (const userData of users) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    }

    // Auth API 테스트에는 다른 테이블 데이터가 필요하지 않음
    // 다른 API 테스트에서 필요할 때 추가 데이터를 삽입하는 메서드를 별도로 만들 수 있음
  }

  async seedFullTestData(): Promise<void> {
    // 모든 테이블에 데이터를 삽입하는 메서드
    await this.seedTestData(); // 기본 사용자 데이터 삽입

    // 상품 데이터 (ID를 명시적으로 설정)
    const products = [
      { id: 1, name: '아메리카노', price: 3000, stock: 100, category: '음료', salesCount: 50, totalRevenue: 150000 },
      { id: 2, name: '카페라떼', price: 4000, stock: 80, category: '음료', salesCount: 60, totalRevenue: 240000 },
      { id: 3, name: '카푸치노', price: 4500, stock: 60, category: '음료', salesCount: 30, totalRevenue: 135000 },
      { id: 4, name: '티라떼', price: 3500, stock: 40, category: '음료', salesCount: 20, totalRevenue: 70000 },
      { id: 5, name: '에스프레소', price: 2000, stock: 120, category: '음료', salesCount: 10, totalRevenue: 20000 },
    ];

    for (const productData of products) {
      const product = this.productRepository.create(productData);
      // ID를 명시적으로 설정
      (product as any).id = productData.id;
      await this.productRepository.save(product);
    }

    // 쿠폰 데이터
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const coupons = [
      { id: 1, userId: 1, couponType: 'DISCOUNT_10PERCENT', discountRate: 10, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { id: 2, userId: 1, couponType: 'DISCOUNT_20PERCENT', discountRate: 20, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { id: 3, userId: 2, couponType: 'FIXED_1000', discountRate: 0, discountAmount: 1000, expiryDate: futureDate, isUsed: false },
      { id: 4, userId: 2, couponType: 'FIXED_2000', discountRate: 0, discountAmount: 2000, expiryDate: futureDate, isUsed: true },
    ];

    for (const couponData of coupons) {
      const coupon = this.couponRepository.create(couponData);
      // ID를 명시적으로 설정
      (coupon as any).id = couponData.id;
      await this.couponRepository.save(coupon);
    }

    // 주문 데이터
    const orders = [
      { id: 1, userId: 1, items: [{ productId: 1, quantity: 2, price: 3000 }], totalAmount: 6000, discountAmount: 600, finalAmount: 5400, couponId: 1, couponUsed: true, status: 'PENDING' },
      { id: 2, userId: 2, items: [{ productId: 2, quantity: 3, price: 4000 }], totalAmount: 12000, discountAmount: 0, finalAmount: 12000, couponId: null, couponUsed: false, status: 'PENDING' },
    ];

    for (const orderData of orders) {
      const order = this.orderRepository.create(orderData);
      // ID를 명시적으로 설정
      (order as any).id = orderData.id;
      await this.orderRepository.save(order);
    }

    // 결제 데이터
    const payments = [
      { id: 1, orderId: 1, userId: 1, totalAmount: 6000, discountAmount: 600, finalAmount: 5400, couponUsed: true, status: 'SUCCESS', paidAt: new Date() },
    ];

    for (const paymentData of payments) {
      const payment = this.paymentRepository.create(paymentData);
      // ID를 명시적으로 설정
      (payment as any).id = paymentData.id;
      await this.paymentRepository.save(payment);
    }

    // 집계 테이블 데이터
    const aggregations = [
      { id: 1, productId: 1, salesCount: 50, totalRevenue: 150000 },
      { id: 2, productId: 2, salesCount: 60, totalRevenue: 240000 },
      { id: 3, productId: 3, salesCount: 30, totalRevenue: 135000 },
      { id: 4, productId: 4, salesCount: 20, totalRevenue: 70000 },
      { id: 5, productId: 5, salesCount: 10, totalRevenue: 20000 },
    ];

    for (const aggregationData of aggregations) {
      const aggregation = this.aggregationRepository.create(aggregationData);
      // ID를 명시적으로 설정
      (aggregation as any).id = aggregationData.id;
      await this.aggregationRepository.save(aggregation);
    }
  }

  async clearTestData(): Promise<void> {
    // 외래키 제약조건을 고려하여 역순으로 삭제
    await this.aggregationRepository.clear();
    await this.paymentRepository.clear();
    await this.orderRepository.clear();
    await this.couponRepository.clear();
    await this.productRepository.clear();
    await this.userRepository.clear();
  }
} 