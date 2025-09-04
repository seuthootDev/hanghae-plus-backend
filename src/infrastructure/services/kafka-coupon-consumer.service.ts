import { Injectable, Logger, Inject } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../application/interfaces/services/coupon-service.interface';
import { KafkaCouponProducerService } from './kafka-coupon-producer.service';
import { CouponIssueRequestEvent } from '../../domain/events/coupon-issue-request.event';
import { CouponIssueResponseEvent } from '../../domain/events/coupon-issue-response.event';

@Injectable()
export class KafkaCouponConsumerService {
  private readonly logger = new Logger(KafkaCouponConsumerService.name);
  private consumer: Consumer;

  constructor(
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface,
    private readonly kafkaCouponProducerService: KafkaCouponProducerService
  ) {
    const kafka = new Kafka({
      clientId: 'coupon-issue-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    
    this.consumer = kafka.consumer({ groupId: 'coupon-issue-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ 
      topic: 'coupon-issue-request',
      fromBeginning: false 
    });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await this.handleCouponIssueRequest(topic, partition, message);
      },
    });
    
    this.logger.log('✅ 카프카 쿠폰 발급 컨슈머 시작 완료');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('🔌 카프카 쿠폰 발급 컨슈머 연결 해제');
  }

  /**
   * 쿠폰 발급 요청 메시지 처리
   * 파티션 기반으로 순서가 보장되어 동시성 이슈 없이 처리
   */
  private async handleCouponIssueRequest(topic: string, partition: number, message: any): Promise<void> {
    try {
      const messageValue = JSON.parse(message.value.toString());
      const correlationId = message.headers?.['correlation-id']?.toString();
      
      this.logger.log(`📨 쿠폰 발급 요청 수신: 파티션 ${partition}, 토픽 ${topic}`);
      this.logger.log(`🔑 메시지 키: ${message.key?.toString()}`);
      this.logger.log(`📋 요청 내용: ${JSON.stringify(messageValue)}`);

      const requestEvent = new CouponIssueRequestEvent(
        messageValue.requestId,
        messageValue.userId,
        messageValue.couponType,
        new Date(messageValue.timestamp),
        correlationId
      );

      // 쿠폰 발급 처리
      const result = await this.processCouponIssue(requestEvent);

      // 응답 전송
      const responseEvent = new CouponIssueResponseEvent(
        requestEvent.requestId,
        requestEvent.userId,
        requestEvent.couponType,
        result.success,
        result.couponId,
        result.errorMessage,
        new Date(),
        correlationId
      );

      await this.kafkaCouponProducerService.sendCouponIssueResponse(responseEvent);

      this.logger.log(`✅ 쿠폰 발급 요청 처리 완료: ${requestEvent.couponType} (사용자 ${requestEvent.userId})`);
    } catch (error) {
      this.logger.error(`❌ 쿠폰 발급 요청 처리 실패:`, error);
      
      // 에러 응답 전송
      try {
        const messageValue = JSON.parse(message.value.toString());
        const correlationId = message.headers?.['correlation-id']?.toString();
        
        const errorResponse = new CouponIssueResponseEvent(
          messageValue.requestId,
          messageValue.userId,
          messageValue.couponType,
          false,
          undefined,
          error.message,
          new Date(),
          correlationId
        );

        await this.kafkaCouponProducerService.sendCouponIssueResponse(errorResponse);
      } catch (responseError) {
        this.logger.error(`❌ 에러 응답 전송 실패:`, responseError);
      }
    }
  }

  /**
   * 실제 쿠폰 발급 처리
   * 기존 CouponsService의 로직을 사용하되, 파티션 기반 순서 보장으로 동시성 이슈 해결
   */
  private async processCouponIssue(requestEvent: CouponIssueRequestEvent): Promise<{
    success: boolean;
    couponId?: number;
    errorMessage?: string;
  }> {
    try {
      this.logger.log(`🎯 쿠폰 발급 처리 시작: ${requestEvent.couponType} (사용자 ${requestEvent.userId})`);

      // 기존 쿠폰 발급 로직 사용
      const coupon = await this.couponsService.issueCoupon({
        userId: requestEvent.userId,
        couponType: requestEvent.couponType
      });

      this.logger.log(`✅ 쿠폰 발급 성공: ID ${coupon.id}, 타입 ${coupon.couponType}`);

      return {
        success: true,
        couponId: coupon.id
      };
    } catch (error) {
      this.logger.error(`❌ 쿠폰 발급 실패: ${requestEvent.couponType} (사용자 ${requestEvent.userId})`, error);
      
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }
}

