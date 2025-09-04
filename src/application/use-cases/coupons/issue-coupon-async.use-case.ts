import { Injectable, Inject } from '@nestjs/common';
import { IssueCouponDto } from '../../../presentation/dto/couponsDTO/issue-coupon.dto';
import { AsyncCouponIssueResponseDto } from '../../../presentation/dto/couponsDTO/async-coupon-issue-response.dto';
import { CouponIssueRequestEvent } from '../../../domain/events/coupon-issue-request.event';
import { KafkaCouponProducerService } from '../../../infrastructure/services/kafka-coupon-producer.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IssueCouponAsyncUseCase {
  constructor(
    private readonly kafkaCouponProducerService: KafkaCouponProducerService
  ) {}

  async execute(issueCouponDto: IssueCouponDto): Promise<AsyncCouponIssueResponseDto> {
    const { userId, couponType } = issueCouponDto;
    
    // 고유한 요청 ID 생성
    const requestId = uuidv4();
    const correlationId = `coupon-issue-${userId}-${Date.now()}`;

    // 쿠폰 발급 요청 이벤트 생성
    const requestEvent = new CouponIssueRequestEvent(
      requestId,
      userId,
      couponType,
      new Date(),
      correlationId
    );

    // 카프카 토픽에 요청 전송
    await this.kafkaCouponProducerService.sendCouponIssueRequest(requestEvent);

    return {
      requestId,
      message: `${couponType} 쿠폰 발급 요청이 접수되었습니다. 처리 결과는 별도로 알려드리겠습니다.`,
      status: 'PENDING'
    };
  }
}
