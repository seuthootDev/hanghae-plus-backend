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
    
    // 관리자 계정만 시딩 (일반 사용자는 회원가입 API로 생성)
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUser = { 
      name: 'admin', 
      email: 'admin@example.com', 
      password: `hashed_${adminPassword}`, // 실제로는 bcrypt로 해싱된 비밀번호
      points: 100000 
    };

    const existingAdmin = await userRepository.findOne({ where: { email: adminUser.email } });
    if (!existingAdmin) {
      const user = userRepository.create(adminUser);
      await userRepository.save(user);
      console.log(`👤 관리자 계정 생성: ${adminUser.name}`);
    } else {
      console.log(`👤 관리자 계정이 이미 존재합니다: ${adminUser.name}`);
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
      } else {
        console.log(`🛍️ 상품이 이미 존재합니다: ${productData.name}`);
      }
    }
  }

  private async seedCoupons() {
    const couponRepository = this.dataSource.getRepository(CouponEntity);
    
    // 기본 쿠폰 정책 (관리자가 사용자에게 발급할 수 있는 쿠폰들)
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
      } else {
        console.log(`🎫 쿠폰이 이미 존재합니다: ${couponData.couponType} (사용자 ${couponData.userId})`);
      }
    }
  }
} 