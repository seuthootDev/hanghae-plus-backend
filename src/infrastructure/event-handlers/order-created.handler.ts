import { Injectable, Logger, Inject } from '@nestjs/common';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';
import { PaymentFailedEvent } from '../../domain/events/payment-failed.event';
import { IEventBus } from '../../common/events/event-bus.interface';

@Injectable()
export class OrderCreatedHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  constructor(
    @Inject('EVENT_BUS')
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 주문 생성 완료 이벤트 처리
   * 10분 타이머 설정 및 만료 시 결제처리실패 이벤트 발행
   */
  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      this.logger.log(`🎯 주문 생성 완료 이벤트 처리 시작: 주문 ${event.orderId}`);
      
      // 10분 후 만료 처리
      const timeoutMs = 10 * 60 * 1000; // 10분
      
      setTimeout(async () => {
        try {
          this.logger.log(`⏰ 주문 ${event.orderId} 결제 시간 초과 (10분)`);
          
          // 결제처리실패 이벤트 발행 (시간 초과)
          this.eventBus.publish(new PaymentFailedEvent(
            event.orderId,
            event.userId,
            event.items,
            event.couponId,
            '결제 시간 초과 (10분)',
            new Date(),
            true // isTimeout = true
          ));
          
        } catch (timeoutError) {
          this.logger.error(`❌ 주문 ${event.orderId} 시간 초과 처리 실패:`, timeoutError);
        }
      }, timeoutMs);
      
      this.logger.log(`✅ 주문 생성 완료 이벤트 처리 완료: 주문 ${event.orderId}, 10분 타이머 설정`);
    } catch (error) {
      this.logger.error(`❌ 주문 생성 완료 이벤트 처리 실패: 주문 ${event.orderId}`, error);
    }
  }
}
