import { DataSource } from 'typeorm';
import { UserEntity } from '../infrastructure/repositories/typeorm/user.entity';
import { ProductEntity } from '../infrastructure/repositories/typeorm/product.entity';
import { CouponEntity } from '../infrastructure/repositories/typeorm/coupon.entity';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    console.log('🌱 데이터베이스 시딩 시작...');

    // 테이블이 생성될 때까지 기다립니다
    await this.waitForTables();

    // 사용자 시딩
    await this.seedUsers();
    
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

  private async seedUsers() {
    const userRepository = this.dataSource.getRepository(UserEntity);
    
    const users = [
      { name: 'admin', email: 'admin@example.com', points: 100000 },
      { name: '김철수', email: 'kim@example.com', points: 15000 },
      { name: '이영희', email: 'lee@example.com', points: 25000 },
      { name: '박민수', email: 'park@example.com', points: 8000 },
    ];

    for (const userData of users) {
      const existingUser = await userRepository.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        console.log(`👤 사용자 생성: ${userData.name}`);
      }
    }
  }

  private async seedProducts() {
    const productRepository = this.dataSource.getRepository(ProductEntity);
    
    const products = [
      { name: '아메리카노', price: 3000, stock: 100, category: '음료', salesCount: 150, totalRevenue: 450000 },
      { name: '카페라떼', price: 4000, stock: 80, category: '음료', salesCount: 120, totalRevenue: 480000 },
      { name: '치킨샌드위치', price: 8000, stock: 50, category: '식품', salesCount: 80, totalRevenue: 640000 },
      { name: '에스프레소', price: 2000, stock: 120, category: '음료', salesCount: 200, totalRevenue: 400000 },
      { name: '티셔츠', price: 15000, stock: 30, category: '의류', salesCount: 25, totalRevenue: 375000 },
    ];

    for (const productData of products) {
      const existingProduct = await productRepository.findOne({ where: { name: productData.name } });
      if (!existingProduct) {
        const product = productRepository.create(productData);
        await productRepository.save(product);
        console.log(`🛍️ 상품 생성: ${productData.name}`);
      }
    }
  }

  private async seedCoupons() {
    const couponRepository = this.dataSource.getRepository(CouponEntity);
    
    const coupons = [
      { userId: 1, couponType: 'DISCOUNT_10PERCENT', discountRate: 10, discountAmount: 0, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isUsed: false },
      { userId: 1, couponType: 'FIXED_1000', discountRate: 0, discountAmount: 1000, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), isUsed: true },
      { userId: 2, couponType: 'DISCOUNT_20PERCENT', discountRate: 20, discountAmount: 0, expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), isUsed: false },
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
        await couponRepository.save(coupon);
        console.log(`🎫 쿠폰 생성: ${couponData.couponType} (사용자 ${couponData.userId})`);
      }
    }
  }
} 