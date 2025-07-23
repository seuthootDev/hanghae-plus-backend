import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';
import { CouponPresenterInterface, COUPON_PRESENTER } from '../../interfaces/presenters/coupon-presenter.interface';

@Injectable()
export class IssueCouponUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    @Inject(COUPON_PRESENTER)
    private readonly couponPresenter: CouponPresenterInterface
  ) {}

  async execute(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.couponsService.issueCoupon(issueCouponDto);
    return this.couponPresenter.presentCoupon(coupon);
  }
} 