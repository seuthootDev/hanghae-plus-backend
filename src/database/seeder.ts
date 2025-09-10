import { DataSource } from 'typeorm';
import { UserEntity } from '../infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../infrastructure/repositories/typeorm/product.entity';
import { CouponEntity } from '../infrastructure/repositories/typeorm/coupon.entity';
import { CouponType } from '../domain/entities/coupon.entity';
import * as bcrypt from 'bcrypt';
import { envConfig } from '../config/env.config';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    console.log('🌱 데이터베이스 시딩 시작...');

    // 테이블이 생성될 때까지 기다립니다
    await this.waitForTables();

    // 관리자 계정 시딩
    await this.seedAdminUser();
    
    // 상품 시딩
    await this.seedProducts();
    
    // 쿠폰 시딩
    await this.seedCoupons();

    console.log('✅ 데이터베이스 시딩 완료!');
  }

  private async waitForTables() {
    console.log('⏳ 테이블 생성 대기 중...');
    let retries = 0;
    const maxRetries = 30; // 30초 대기

    while (retries < maxRetries) {
      try {
        // users 테이블이 존재하는지 확인
        await this.dataSource.query('SELECT 1 FROM users LIMIT 1');
        console.log('✅ 테이블이 준비되었습니다!');
        return;
      } catch (error) {
        retries++;
        console.log(`⏳ 테이블 대기 중... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('테이블 생성 시간 초과');
  }

  private async seedAdminUser() {
    const userRepository = this.dataSource.getRepository(UserEntity);
    
    // 관리자 계정과 테스트 사용자들 시딩
    const hashedPassword = await bcrypt.hash(envConfig.admin.password, envConfig.bcrypt.saltRounds);
    const testPassword = await bcrypt.hash('password123', envConfig.bcrypt.saltRounds);
    
    const users = [
      { id: 1, name: envConfig.admin.name, email: envConfig.admin.email, password: hashedPassword, points: 100000 },
      { id: 2, name: 'Test User 1', email: 'test1@example.com', password: testPassword, points: 50000 },
      { id: 3, name: 'Test User 2', email: 'test2@example.com', password: testPassword, points: 30000 },
      { id: 4, name: 'Test User 3', email: 'test3@example.com', password: testPassword, points: 0 },
      { id: 5, name: 'Test User 4', email: 'test4@example.com', password: testPassword, points: 10000 },
    ];

    for (const userData of users) {
      const existingUser = await userRepository.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const user = userRepository.create(userData);
        // ID를 명시적으로 설정
        (user as any).id = userData.id;
        await userRepository.save(user);
        console.log(`👤 사용자 생성: ${userData.name} (ID: ${userData.id})`);
      } else {
        console.log(`👤 사용자가 이미 존재합니다: ${userData.name} (ID: ${userData.id})`);
      }
    }
  }

  private async seedProducts() {
    const productRepository = this.dataSource.getRepository(ProductEntity);
    
    const products = [
      { id: 1, name: '아메리카노', price: 3000, stock: 100, category: '음료', salesCount: 150, totalRevenue: 450000 },
      { id: 2, name: '카페라떼', price: 4000, stock: 80, category: '음료', salesCount: 120, totalRevenue: 480000 },
      { id: 3, name: '치킨샌드위치', price: 8000, stock: 50, category: '식품', salesCount: 80, totalRevenue: 640000 },
      { id: 4, name: '에스프레소', price: 2000, stock: 120, category: '음료', salesCount: 200, totalRevenue: 400000 },
      { id: 5, name: '티셔츠', price: 15000, stock: 30, category: '의류', salesCount: 25, totalRevenue: 375000 },
    ];

    for (const productData of products) {
      const existingProduct = await productRepository.findOne({ where: { name: productData.name } });
      if (!existingProduct) {
        const product = productRepository.create(productData);
        // ID를 명시적으로 설정
        (product as any).id = productData.id;
        await productRepository.save(product);
        console.log(`🛍️ 상품 생성: ${productData.name} (ID: ${productData.id})`);
      } else {
        console.log(`🛍️ 상품이 이미 존재합니다: ${productData.name} (ID: ${productData.id})`);
      }
    }
  }

  private async seedCoupons() {
    const couponRepository = this.dataSource.getRepository(CouponEntity);
    
    // 미래 날짜 설정
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    // 기본 쿠폰 정책 (관리자가 사용자에게 발급할 수 있는 쿠폰들)
    const coupons = [
      { id: 1, userId: 1, couponType: CouponType.DISCOUNT_10PERCENT, discountRate: 10, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { id: 2, userId: 1, couponType: CouponType.FIXED_1000, discountRate: 0, discountAmount: 1000, expiryDate: futureDate, isUsed: true },
      { id: 3, userId: 2, couponType: CouponType.DISCOUNT_20PERCENT, discountRate: 20, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { id: 4, userId: 2, couponType: CouponType.FIXED_2000, discountRate: 0, discountAmount: 2000, expiryDate: futureDate, isUsed: false },
      { id: 5, userId: 3, couponType: CouponType.DISCOUNT_30PERCENT, discountRate: 30, discountAmount: 0, expiryDate: futureDate, isUsed: false },
      { id: 6, userId: 4, couponType: CouponType.LIMITED_OFFER, discountRate: 15, discountAmount: 0, expiryDate: futureDate, isUsed: false },
    ];

    for (const couponData of coupons) {
      const existingCoupon = await couponRepository.findOne({ 
        where: { 
          userId: couponData.userId, 
          couponType: couponData.couponType 
        } 
      });
      if (!existingCoupon) {
        const coupon = couponRepository.create(couponData);
        // ID를 명시적으로 설정
        (coupon as any).id = couponData.id;
        await couponRepository.save(coupon);
        console.log(`🎫 쿠폰 생성: ${couponData.couponType} (사용자 ${couponData.userId}, ID: ${couponData.id})`);
      } else {
        console.log(`🎫 쿠폰이 이미 존재합니다: ${couponData.couponType} (사용자 ${couponData.userId})`);
      }
    }
  }
} 