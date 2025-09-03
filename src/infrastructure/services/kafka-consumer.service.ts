import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { DataPlatformService } from './data-platform.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly dataPlatformService: DataPlatformService
  ) {
    this.kafka = new Kafka({
      clientId: 'hanghae-plus-backend-consumer',
      brokers: ['localhost:9092'],
    });
    this.consumer = this.kafka.consumer({ 
      groupId: 'data-platform-group'
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.logger.log('✅ 카프카 컨슈머 연결 완료');
      
      // payment-completed 토픽 구독
      await this.consumer.subscribe({ 
        topic: 'payment-completed', 
        fromBeginning: true 
      });
      
      // 메시지 처리 시작
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handlePaymentCompletedMessage(topic, partition, message);
        },
      });
      
      this.logger.log('✅ 카프카 컨슈머 메시지 처리 시작');
    } catch (error) {
      this.logger.error('❌ 카프카 컨슈머 초기화 실패:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('✅ 카프카 컨슈머 연결 해제 완료');
    } catch (error) {
      this.logger.error('❌ 카프카 컨슈머 연결 해제 실패:', error);
    }
  }

  /**
   * 결제 완료 메시지 처리
   */
  private async handlePaymentCompletedMessage(topic: string, partition: number, message: any): Promise<void> {
    try {
      const messageKey = message.key?.toString();
      const messageValue = message.value?.toString();
      
      this.logger.log(`📥 카프카 메시지 수신: 토픽=${topic}, 파티션=${partition}, 키=${messageKey}`);
      
      if (!messageValue) {
        this.logger.warn('⚠️ 메시지 값이 비어있습니다.');
        return;
      }

      const orderData = JSON.parse(messageValue);
      
      this.logger.log(`🎯 결제 완료 데이터 처리 시작: 주문 ${orderData.orderId}`);
      
      // 데이터 플랫폼으로 전송
      await this.dataPlatformService.sendOrderData(orderData);
      
      this.logger.log(`✅ 결제 완료 데이터 처리 완료: 주문 ${orderData.orderId}`);
    } catch (error) {
      this.logger.error(`❌ 결제 완료 메시지 처리 실패: 토픽=${topic}, 파티션=${partition}`, error);
      
      // 메시지 처리 실패는 로깅만 하고 예외를 던지지 않음
      // (다른 메시지 처리에 영향을 주지 않기 위함)
      // 실제 운영에서는 데드레터 큐나 재시도 로직 구현
    }
  }
}
