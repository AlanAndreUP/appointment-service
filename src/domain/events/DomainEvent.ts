export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly payload: any;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly version: number;
  public readonly payload: any;

  constructor(
    eventType: string,
    aggregateId: string,
    payload: any,
    version: number = 1
  ) {
    this.eventId = this.generateEventId();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.version = version;
    this.payload = payload;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
} 