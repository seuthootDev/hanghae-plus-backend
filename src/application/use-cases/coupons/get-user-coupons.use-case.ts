import { Injectable, Inject } from '@nestjs/common';
import { CouponResponseDto } from '../../../presentation/dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupons-service.interface';

@Injectable()
export class GetUserCouponsUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  async execute(userId: number): Promise<CouponResponseDto[]> {
    return this.couponsService.getUserCoupons(userId);
  }
} 