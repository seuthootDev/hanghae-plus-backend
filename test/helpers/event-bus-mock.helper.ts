import { IEventBus } from '../../src/common/events/event-bus.interface';

export class EventBusMock implements IEventBus {
  private publishedEvents: any[] = [];
  private handlers = new Map<string, Function[]>();

  publish(event: any): void {
    this.publishedEvents.push(event);
  }

  subscribe(eventType: any, handler: Function): void {
    const eventName = eventType.name;
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  // 테스트 헬퍼 메서드들
  getPublishedEvents(): any[] {
    return this.publishedEvents;
  }

  getPublishedEventsByType(eventType: any): any[] {
    const eventName = eventType.name;
    return this.publishedEvents.filter(event => event.constructor.name === eventName);
  }

  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }

  hasPublishedEvent(eventType: any): boolean {
    const eventName = eventType.name;
    return this.publishedEvents.some(event => event.constructor.name === eventName);
  }
}
