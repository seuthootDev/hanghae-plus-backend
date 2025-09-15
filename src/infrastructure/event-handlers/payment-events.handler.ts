import { Injectable, Logger } from '@nestjs/common';
import { PaymentCompletedEvent } from '../../domain/events/payment-completed.event';
import { KafkaProducerService } from '../services/kafka-producer.service';

@Injectable()
export class PaymentCompletedHandler {
  private readonly logger = new Logger(PaymentCompletedHandler.name);

  constructor(
    private readonly kafkaProducerService: KafkaProducerService
  ) {}

  /**
   * 결제 완료 이벤트 처리
   * 카프카 토픽에 주문 정보 전송
   */
  async handle(event: PaymentCompletedEvent): Promise<void> {
    try {
      this.logger.log(`🎯 결제 완료 이벤트 처리 시작: 주문 ${event.orderId}`);
      
      // 카프카로 전송할 데이터 구성
      const orderData = {
        orderId: event.orderId,
        userId: event.userId,
        products: event.products,
        totalAmount: event.totalAmount,
        discountAmount: event.discountAmount,
        finalAmount: event.finalAmount,
        couponUsed: event.couponUsed,
        status: event.status,
        paidAt: event.paidAt,
        timestamp: new Date().toISOString(),
        source: 'hanghae-plus-backend',
        version: '1.0.0'
      };

      // 카프카 토픽에 메시지 전송
      await this.kafkaProducerService.sendPaymentCompletedData(orderData);
      
      this.logger.log(`✅ 결제 완료 이벤트 처리 완료: 주문 ${event.orderId}`);
    } catch (error) {
      this.logger.error(`❌ 결제 완료 이벤트 처리 실패: 주문 ${event.orderId}`, error);
      
      // 이벤트 처리 실패는 로깅만 하고 예외를 던지지 않음
      // (주문/결제 프로세스에 영향을 주지 않기 위함)
      // 실제 운영에서는 재시도 큐나 데드레터 큐로 처리
    }
  }
}
