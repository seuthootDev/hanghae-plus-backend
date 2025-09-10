import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { CouponIssueRequestEvent } from '../../domain/events/coupon-issue-request.event';

@Injectable()
export class KafkaCouponProducerService {
  private readonly logger = new Logger(KafkaCouponProducerService.name);
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'coupon-issue-producer',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });
    
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('✅ 카프카 쿠폰 발급 프로듀서 연결 완료');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('🔌 카프카 쿠폰 발급 프로듀서 연결 해제');
  }

  /**
   * 쿠폰 발급 요청을 카프카 토픽에 전송
   * 메시지 키를 쿠폰 타입으로 설정하여 파티션 기반 순서 보장
   */
  async sendCouponIssueRequest(event: CouponIssueRequestEvent): Promise<void> {
    try {
      const message = {
        requestId: event.requestId,
        userId: event.userId,
        couponType: event.couponType,
        timestamp: event.timestamp.toISOString(),
        correlationId: event.correlationId
      };

      // 메시지 키를 쿠폰 타입으로 설정하여 같은 쿠폰 타입의 요청들이 같은 파티션으로 전송
      const messageKey = event.couponType;

      await this.producer.send({
        topic: 'coupon-issue-request',
        messages: [{
          key: messageKey,
          value: JSON.stringify(message),
          headers: {
            'content-type': 'application/json',
            'event-type': 'CouponIssueRequest',
            'correlation-id': event.correlationId || event.requestId
          }
        }]
      });

      this.logger.log(`📤 쿠폰 발급 요청 전송: ${event.couponType} (사용자 ${event.userId})`);
    } catch (error) {
      this.logger.error(`❌ 쿠폰 발급 요청 전송 실패: ${event.couponType} (사용자 ${event.userId})`, error);
      throw error;
    }
  }

  /**
   * 쿠폰 발급 응답을 카프카 토픽에 전송
   */
  async sendCouponIssueResponse(response: any): Promise<void> {
    try {
      const message = {
        requestId: response.requestId,
        userId: response.userId,
        couponType: response.couponType,
        success: response.success,
        couponId: response.couponId,
        errorMessage: response.errorMessage,
        timestamp: response.timestamp.toISOString(),
        correlationId: response.correlationId
      };

      // 응답 메시지의 키는 사용자 ID로 설정
      const messageKey = response.userId.toString();

      await this.producer.send({
        topic: 'coupon-issue-response',
        messages: [{
          key: messageKey,
          value: JSON.stringify(message),
          headers: {
            'content-type': 'application/json',
            'event-type': 'CouponIssueResponse',
            'correlation-id': response.correlationId || response.requestId
          }
        }]
      });

      this.logger.log(`📤 쿠폰 발급 응답 전송: ${response.couponType} (사용자 ${response.userId}) - ${response.success ? '성공' : '실패'}`);
    } catch (error) {
      this.logger.error(`❌ 쿠폰 발급 응답 전송 실패: ${response.couponType} (사용자 ${response.userId})`, error);
      throw error;
    }
  }
}

