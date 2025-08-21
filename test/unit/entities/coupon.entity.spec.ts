import { Coupon, CouponType } from '../../../src/domain/entities/coupon.entity';

describe('Coupon Entity', () => {
  let validCoupon: Coupon;
  let expiredCoupon: Coupon;
  let usedCoupon: Coupon;
  let rateCoupon: Coupon;
  let amountCoupon: Coupon;

  beforeEach(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30일 후

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1일 전

    validCoupon = new Coupon(1, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, futureDate, false);
    expiredCoupon = new Coupon(2, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, pastDate, false);
    usedCoupon = new Coupon(3, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, futureDate, true);
    rateCoupon = new Coupon(4, 1, CouponType.DISCOUNT_20PERCENT, 20, 0, futureDate, false);
    amountCoupon = new Coupon(5, 1, CouponType.FIXED_2000, 0, 2000, futureDate, false);
  });

  describe('getters', () => {
    it('isUsed getter가 쿠폰 사용 여부를 반환해야 한다', () => {
      expect(validCoupon.isUsed).toBe(false);
      expect(usedCoupon.isUsed).toBe(true);
    });
  });

  describe('use', () => {
    it('쿠폰을 성공적으로 사용해야 한다', () => {
      expect(validCoupon.isUsed).toBe(false);

      validCoupon.use();

      expect(validCoupon.isUsed).toBe(true);
    });

    it('이미 사용된 쿠폰을 다시 사용해도 상태가 유지되어야 한다', () => {
      expect(usedCoupon.isUsed).toBe(true);

      usedCoupon.use();

      expect(usedCoupon.isUsed).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('유효한 쿠폰은 만료되지 않았음을 반환해야 한다', () => {
      expect(validCoupon.isExpired()).toBe(false);
    });

    it('만료된 쿠폰은 만료되었음을 반환해야 한다', () => {
      expect(expiredCoupon.isExpired()).toBe(true);
    });

    it('오늘 만료되는 쿠폰은 만료되지 않았음을 반환해야 한다', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayExpiry = new Coupon(6, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, tomorrow, false);
      expect(todayExpiry.isExpired()).toBe(false);
    });
  });

  describe('isValid', () => {
    it('유효한 쿠폰은 true를 반환해야 한다', () => {
      expect(validCoupon.isValid()).toBe(true);
    });

    it('만료된 쿠폰은 false를 반환해야 한다', () => {
      expect(expiredCoupon.isValid()).toBe(false);
    });

    it('사용된 쿠폰은 false를 반환해야 한다', () => {
      expect(usedCoupon.isValid()).toBe(false);
    });

    it('만료되고 사용된 쿠폰은 false를 반환해야 한다', () => {
      const expiredAndUsed = new Coupon(7, 1, CouponType.DISCOUNT_10PERCENT, 10, 0, new Date(Date.now() - 86400000), true);
      expect(expiredAndUsed.isValid()).toBe(false);
    });
  });

  describe('calculateDiscount', () => {
    describe('rate discount', () => {
      it('할인율 쿠폰이 올바른 할인을 계산해야 한다', () => {
        const totalAmount = 10000;
        const discount = rateCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(2000); // 10000 * 0.2
      });

      it('할인율 쿠폰이 소수점을 내림해야 한다', () => {
        const totalAmount = 9999;
        const discount = rateCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(1999); // 9999 * 0.2 = 1999.8 -> 1999
      });

      it('유효하지 않은 할인율 쿠폰은 0을 반환해야 한다', () => {
        const totalAmount = 10000;
        const discount = usedCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(0);
      });
    });

    describe('amount discount', () => {
      it('할인금액 쿠폰이 올바른 할인을 계산해야 한다', () => {
        const totalAmount = 10000;
        const discount = amountCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(2000);
      });

      it('할인금액이 총 금액보다 클 때도 처리해야 한다', () => {
        const totalAmount = 3000;
        const discount = amountCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(2000); // 할인금액이 총 금액보다 클 수 있음
      });

      it('유효하지 않은 할인금액 쿠폰은 0을 반환해야 한다', () => {
        const totalAmount = 10000;
        const discount = expiredCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('0원 주문에 대해서도 처리해야 한다', () => {
        const totalAmount = 0;
        const discount = rateCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(0);
      });

      it('음수 주문에 대해서도 처리해야 한다', () => {
        const totalAmount = -1000;
        const discount = rateCoupon.calculateDiscount(totalAmount);

        expect(discount).toBe(-200); // -1000 * 0.2
      });
    });
  });

  describe('coupon types', () => {
    it('DISCOUNT_20PERCENT 타입 쿠폰이 할인율을 사용해야 한다', () => {
      expect(rateCoupon.couponType).toBe(CouponType.DISCOUNT_20PERCENT);
      expect(rateCoupon.discountRate).toBe(20);
      expect(rateCoupon.discountAmount).toBe(0);
    });

    it('FIXED_2000 타입 쿠폰이 할인금액을 사용해야 한다', () => {
      expect(amountCoupon.couponType).toBe(CouponType.FIXED_2000);
      expect(amountCoupon.discountRate).toBe(0);
      expect(amountCoupon.discountAmount).toBe(2000);
    });

    it('DISCOUNT_10PERCENT 타입 쿠폰이 기본값을 가져야 한다', () => {
      expect(validCoupon.couponType).toBe(CouponType.DISCOUNT_10PERCENT);
      expect(validCoupon.discountRate).toBe(10);
      expect(validCoupon.discountAmount).toBe(0);
    });
  });
}); 