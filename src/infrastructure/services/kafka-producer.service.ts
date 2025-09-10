import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'hanghae-plus-backend',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('✅ 카프카 프로듀서 연결 완료');
    } catch (error) {
      this.logger.error('❌ 카프카 프로듀서 연결 실패:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('✅ 카프카 프로듀서 연결 해제 완료');
    } catch (error) {
      this.logger.error('❌ 카프카 프로듀서 연결 해제 실패:', error);
    }
  }

  /**
   * 카프카 토픽에 메시지 전송
   */
  async sendMessage(topic: string, message: any, key?: string): Promise<void> {
    try {
      this.logger.log(`📤 카프카 메시지 전송 시작: 토픽=${topic}, 키=${key || '없음'}`);
      
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.log(`✅ 카프카 메시지 전송 완료: 토픽=${topic}, 키=${key || '없음'}`);
    } catch (error) {
      this.logger.error(`❌ 카프카 메시지 전송 실패: 토픽=${topic}, 키=${key || '없음'}`, error);
      throw new Error(`카프카 메시지 전송 실패: ${error.message}`);
    }
  }

  /**
   * 결제 완료 데이터를 카프카에 전송
   */
  async sendPaymentCompletedData(orderData: any): Promise<void> {
    await this.sendMessage('payment-completed', orderData, orderData.orderId);
  }
}
