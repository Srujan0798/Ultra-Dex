/**
 * DexGraph Typed Event System
 *
 * Discriminated union of all workflow/task lifecycle events.
 * Every critical state transition emits one of these events.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Cost type (reused across events)
// ──────────────────────────────────────────────────────────────────────────────

export interface ExecutionCost {
  tokens: number;
  estimatedUSD: number;
  provider: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Individual event types
// ──────────────────────────────────────────────────────────────────────────────

export interface WorkflowStartedEvent {
  type: 'workflow.started';
  workflowId: string;
  timestamp: string; // ISO
  totalNodes: number;
  workflowName?: string;
}

export interface TaskStartedEvent {
  type: 'task.started';
  taskId: string;
  workflowId: string;
  timestamp: string;
  agentType: string; // role: architect | engineer | tester | reviewer
}

export interface TaskCompletedEvent {
  type: 'task.completed';
  taskId: string;
  workflowId: string;
  timestamp: string;
  output: unknown;
  cost: ExecutionCost;
  durationMs: number;
  confidence: number;
}

export interface TaskFailedEvent {
  type: 'task.failed';
  taskId: string;
  workflowId: string;
  timestamp: string;
  error: string;
  reason: string;
  retryCount: number;
}

export interface TaskRetryEvent {
  type: 'task.retry';
  taskId: string;
  workflowId: string;
  timestamp: string;
  attempt: number;
  backoffMs: number;
}

export interface TaskBlockedEvent {
  type: 'task.blocked';
  taskId: string;
  workflowId: string;
  timestamp: string;
  reason: string;
  blockType: 'hard' | 'soft';
}

export interface WorkflowCompletedEvent {
  type: 'workflow.completed';
  workflowId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  totalCost: ExecutionCost;
  durationMs: number;
  completedNodes: string[];
  failedNodes: string[];
}

export interface StateTransitionEvent {
  type: 'state.transition';
  nodeId: string;
  workflowId?: string;
  timestamp: string;
  from: string;
  to: string;
  reason?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Discriminated union — the canonical event type
// ──────────────────────────────────────────────────────────────────────────────

export type UltraDexEvent =
  | WorkflowStartedEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskRetryEvent
  | TaskBlockedEvent
  | WorkflowCompletedEvent
  | StateTransitionEvent;

export type UltraDexEventType = UltraDexEvent['type'];

// ──────────────────────────────────────────────────────────────────────────────
// Typed EventBus
// ──────────────────────────────────────────────────────────────────────────────

type ListenerMap = {
  [K in UltraDexEventType]: ((event: Extract<UltraDexEvent, { type: K }>) => void)[];
};

export class EventBus {
  private listeners: Partial<ListenerMap> = {};

  /** Subscribe to a typed event */
  on<K extends UltraDexEventType>(
    type: K,
    listener: (event: Extract<UltraDexEvent, { type: K }>) => void,
  ): this {
    if (!this.listeners[type]) {
      (this.listeners as ListenerMap)[type] = [] as never;
    }
    (this.listeners[type] as ((e: unknown) => void)[]).push(listener as (e: unknown) => void);
    return this;
  }

  /** Subscribe to a typed event once */
  once<K extends UltraDexEventType>(
    type: K,
    listener: (event: Extract<UltraDexEvent, { type: K }>) => void,
  ): this {
    const wrapper = (event: Extract<UltraDexEvent, { type: K }>) => {
      listener(event);
      this.off(type, wrapper);
    };
    return this.on(type, wrapper);
  }

  /** Unsubscribe a specific listener */
  off<K extends UltraDexEventType>(
    type: K,
    listener: (event: Extract<UltraDexEvent, { type: K }>) => void,
  ): this {
    if (!this.listeners[type]) return this;
    (this.listeners[type] as ((e: unknown) => void)[]) = (
      this.listeners[type] as ((e: unknown) => void)[]
    ).filter(l => l !== listener);
    return this;
  }

  /** Emit an event to all subscribers; listeners are wrapped in try/catch to prevent blocking */
  emit<E extends UltraDexEvent>(event: E): void {
    const handlers = this.listeners[event.type as UltraDexEventType];
    if (!handlers) return;
    for (const handler of handlers as ((e: unknown) => void)[]) {
      try {
        handler(event);
      } catch {
        // Listeners must not crash the execution pipeline
      }
    }
  }

  /** Get count of listeners for a given event type */
  listenerCount(type: UltraDexEventType): number {
    return (this.listeners[type] ?? []).length;
  }

  /** Remove all listeners */
  removeAllListeners(): void {
    this.listeners = {};
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory helpers
// ──────────────────────────────────────────────────────────────────────────────

let _globalBus: EventBus | undefined;

/** Get (or create) the process-global EventBus singleton */
export function getGlobalEventBus(): EventBus {
  if (!_globalBus) _globalBus = new EventBus();
  return _globalBus;
}

/** Create a fresh, isolated EventBus (for tests, sandboxed workflows, etc.) */
export function createEventBus(): EventBus {
  return new EventBus();
}

/** ISO timestamp helper */
export function now(): string {
  return new Date().toISOString();
}
