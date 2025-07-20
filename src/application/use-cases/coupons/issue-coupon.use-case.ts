import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';

@Injectable()
export class IssueCouponUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  async execute(issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.issueCoupon(issueCouponDto);
  }
} 