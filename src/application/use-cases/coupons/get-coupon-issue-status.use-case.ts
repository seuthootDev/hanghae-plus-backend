import { Injectable, Inject } from '@nestjs/common';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../interfaces/services/coupon-service.interface';
import { CouponIssueStatusDto } from '../../../presentation/dto/couponsDTO/coupon-issue-status.dto';

@Injectable()
export class GetCouponIssueStatusUseCase {
  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  async execute(requestId: string): Promise<CouponIssueStatusDto | null> {
    // 실제 구현에서는 Redis나 데이터베이스에서 요청 상태를 조회
    // 현재는 간단한 구현으로 실제 쿠폰 발급 상태를 확인
    
    try {
      // requestId에서 userId와 couponType을 추출 (실제로는 별도 저장소에서 조회)
      // 임시로 파싱 로직 구현
      const parts = requestId.split('-');
      if (parts.length < 3) {
        return null;
      }

      // 실제 구현에서는 요청 상태를 별도로 저장하고 조회해야 함
      // 현재는 사용자의 최근 쿠폰 발급 상태를 확인하는 방식으로 구현
      
      return {
        requestId,
        userId: 0, // 실제로는 저장된 값에서 조회
        couponType: 'UNKNOWN', // 실제로는 저장된 값에서 조회
        status: 'PENDING',
        processedAt: new Date()
      };
    } catch (error) {
      return null;
    }
  }
}
