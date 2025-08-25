import { Injectable } from '@nestjs/common';
import { IEventBus } from './event-bus.interface';

@Injectable()
export class EventBus implements IEventBus {
  private handlers = new Map<string, Function[]>();

  publish(event: any): void {
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];
    
    // 비동기로 핸들러 실행 (Fire-and-Forget)
    handlers.forEach(handler => {
      setImmediate(() => {
        try {
          handler(event);
        } catch (error) {
          console.error(`이벤트 핸들러 실행 실패 (${eventType}):`, error);
        }
      });
    });
  }

  subscribe(eventType: any, handler: Function): void {
    const eventName = eventType.name;
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    this.handlers.get(eventName)!.push(handler);
  }
}
