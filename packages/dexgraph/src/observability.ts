export type EventType =
  | 'node.transition'
  | 'node.dispatch'
  | 'node.complete'
  | 'node.failed'
  | 'scheduler.start'
  | 'scheduler.complete'
  | 'scheduler.error'
  | 'governance.block'
  | 'governance.pause'
  | 'workflow.create'
  | 'workflow.complete';

export interface DexEvent {
  type: EventType;
  timestamp: string;
  nodeId?: string;
  workflowId?: string;
  data: Record<string, unknown>;
}

export type EventHandler = (event: DexEvent) => void;

export class EventEmitter {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  on(type: EventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  off(type: EventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(type, existing.filter(h => h !== handler));
  }

  emit(event: DexEvent): void {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) handler(event);
  }

  getListenerCount(type: EventType): number {
    return (this.handlers.get(type) || []).length;
  }

  clear(): void { this.handlers.clear(); }
}

export function createEvent(type: EventType, data: Record<string, unknown>, nodeId?: string, workflowId?: string): DexEvent {
  return { type, timestamp: new Date().toISOString(), nodeId, workflowId, data };
}
