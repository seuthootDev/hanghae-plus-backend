export interface IEventBus {
  publish(event: any): void;
  subscribe(eventType: any, handler: Function): void;
}
