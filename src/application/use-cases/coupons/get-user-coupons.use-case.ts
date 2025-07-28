import { Injectable, Inject } from '@nestjs/common';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';
import { CouponPresenterInterface, COUPON_PRESENTER } from '../../interfaces/presenters/coupon-presenter.interface';

@Injectable()
export class GetUserCouponsUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    @Inject(COUPON_PRESENTER)
    private readonly couponPresenter: CouponPresenterInterface
  ) {}

  async execute(userId: number): Promise<CouponResponseDto[]> {
    const coupons = await this.couponsService.getUserCoupons(userId);
    return this.couponPresenter.presentCouponList(coupons);
  }
} 