/**
 * Better Stack Log Integration
 * Sends structured logs to Better Stack for monitoring and analytics
 */

const BETTER_STACK_SOURCE_TOKEN = process.env.BETTER_STACK_SOURCE_TOKEN;
const BETTER_STACK_ENDPOINT = 'https://in.logs.betterstack.com';

interface LogEntry {
  dt: string;
  message: string;
  level: string;
  [key: string]: unknown;
}

export class BetterStackLogger {
  private sourceToken: string;
  private batch: LogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(sourceToken?: string) {
    this.sourceToken = sourceToken || BETTER_STACK_SOURCE_TOKEN || '';

    // Flush batch every 5 seconds
    setInterval(() => this.flush(), 5000);
  }

  private createEntry(
    level: string,
    message: string,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      dt: new Date().toISOString(),
      message,
      level: level.toUpperCase(),
      service: 'ultra-dex',
      environment: process.env.NODE_ENV || 'development',
      ...metadata,
    };
  }

  async log(level: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    const entry = this.createEntry(level, message, metadata);

    // Always log to console
    console.log(`[${entry.dt}] ${level.toUpperCase()}: ${message}`, metadata || '');

    if (!this.sourceToken) {
      return;
    }

    // Add to batch
    this.batch.push(entry);

    // Flush if batch is large
    if (this.batch.length >= 10) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0 || !this.sourceToken) {
      return;
    }

    const logsToSend = [...this.batch];
    this.batch = [];

    try {
      const response = await fetch(BETTER_STACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sourceToken}`,
        },
        body: JSON.stringify(logsToSend),
      });

      if (!response.ok) {
        console.error('Failed to send logs to Better Stack:', response.status);
      }
    } catch (error) {
      console.error('Error sending logs to Better Stack:', error);
    }
  }

  // Convenience methods
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  // Business event logging
  track(event: string, properties?: Record<string, unknown>): void {
    this.log('info', `Event: ${event}`, {
      event_type: event,
      ...properties,
    });
  }

  // Track user signup
  userSignup(userId: string, email: string, tier: string = 'free'): void {
    this.track('user_signup', {
      user_id: userId,
      email,
      tier,
      timestamp: new Date().toISOString(),
    });
  }

  // Track user login
  userLogin(userId: string, email: string): void {
    this.track('user_login', {
      user_id: userId,
      email,
      timestamp: new Date().toISOString(),
    });
  }

  // Track AI request
  aiRequest(
    provider: string,
    model: string,
    tokens: number,
    latencyMs: number,
    cost?: number
  ): void {
    this.track('ai_request', {
      provider,
      model,
      tokens,
      latency_ms: latencyMs,
      cost,
      timestamp: new Date().toISOString(),
    });
  }

  // Track billing event
  billingEvent(event: string, userId: string, amount?: number, tier?: string): void {
    this.track('billing_event', {
      billing_event: event,
      user_id: userId,
      amount,
      tier,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new BetterStackLogger();

// Named exports for production-server.ts compatibility
export function logEvent(event: string, properties?: Record<string, unknown>): void {
  logger.track(event, properties);
}

export function logError(
  message: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error(message, { ...metadata, error: errorMessage, stack: errorStack });
}

export function logAIRequest(params: {
  userId?: string;
  provider: string;
  model: string;
  tokens: number;
  cost?: number;
  latency: number;
  metadata?: Record<string, unknown>;
}): void {
  logger.aiRequest(params.provider, params.model, params.tokens, params.latency, params.cost);
}

// Billing-specific logging functions for billing-service.ts
export function logSubscriptionCreated(
  userId: string,
  tierId: string,
  subscriptionId: string
): void {
  logger.billingEvent('subscription_created', userId, undefined, tierId);
  logger.track('subscription_created', { userId, tierId, subscriptionId });
}

export function logPaymentSucceeded(userId: string, amount: number, currency: string): void {
  logger.billingEvent('payment_succeeded', userId, amount);
  logger.track('payment_succeeded', { userId, amount, currency });
}

export function logSubscriptionCancelled(userId: string, subscriptionId: string): void {
  logger.billingEvent('subscription_cancelled', userId);
  logger.track('subscription_cancelled', { userId, subscriptionId });
}
