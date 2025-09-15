export interface IEventBus {
  publish(event: any): void;
  subscribe(eventType: any, handler: Function): void;
}

export const EVENT_BUS = 'EVENT_BUS';