// Logger compatibility layer for governance audit
// Delegates to Better Stack logger

import { logger as betterStackLogger } from '../monitoring/better-stack-logger.js';

interface GovernanceEvent {
  data: Record<string, unknown>;
  timestamp: number;
}

type GovernanceEventHandler = (event: GovernanceEvent) => Promise<unknown> | unknown;

interface GovernanceSubscription {
  handler: GovernanceEventHandler;
  options: Record<string, unknown>;
}

interface GovernanceLoggerSink {
  track(event: string, properties?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
}

const loggerSink = betterStackLogger as unknown as GovernanceLoggerSink;

class GovernanceLogger {
  subscribers = new Map<string, GovernanceSubscription[]>();

  subscribe(
    topic: string,
    handler: GovernanceEventHandler,
    options: Record<string, unknown> = {}
  ): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)?.push({ handler, options });
  }

  async event(
    eventType: string,
    data: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ): Promise<void> {
    void options;
    // Log to Better Stack
    loggerSink.track(eventType, data);

    // Notify subscribers
    const subscribers = this.subscribers.get(eventType) || [];
    for (const { handler } of subscribers) {
      try {
        await handler({ data, timestamp: Date.now() });
      } catch (error) {
        console.error('Logger subscriber error:', error);
      }
    }
  }

  // Delegate other methods to Better Stack logger
  info(message: string, context?: Record<string, unknown>): void {
    loggerSink.info(message, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    loggerSink.error(message, error, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    loggerSink.warn(message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    loggerSink.debug(message, context);
  }
}

export const logger = new GovernanceLogger();
