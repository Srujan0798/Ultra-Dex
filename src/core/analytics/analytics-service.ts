import { posthog } from './posthog-client.js';
import { sentry } from './sentry-client.js';

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  track(event: string, properties: Record<string, unknown> = {}, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId,
      properties,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);

    // Track in PostHog
    posthog.track(event, properties, userId);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  identify(userId: string, traits: Record<string, unknown>): void {
    posthog.identify(userId, traits);
    const email = typeof traits.email === 'string' ? traits.email : undefined;
    sentry.setUser(userId, email);
  }

  trackAIRequest(
    userId: string,
    provider: string,
    model: string,
    tokens: number,
    cost: number,
    latencyMs: number
  ): void {
    this.track('ai_request', { provider, model, tokens, cost, latencyMs }, userId);
  }

  trackError(error: unknown, context?: Record<string, unknown>, userId?: string): void {
    // Send to both PostHog and Sentry
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.track('error', { error: errorMessage, ...context }, userId);
    sentry.captureException(error, context);
  }

  async flush(): Promise<void> {
    await Promise.all([posthog.flush(), sentry.flush()]);
  }

  getEvents(filter?: { event?: string; userId?: string }): AnalyticsEvent[] {
    let filtered = this.events;

    if (filter?.event) {
      filtered = filtered.filter((e) => e.event === filter.event);
    }

    if (filter?.userId) {
      filtered = filtered.filter((e) => e.userId === filter.userId);
    }

    return filtered;
  }

  getDashboardStats(): {
    totalEvents: number;
    uniqueUsers: number;
    topEvents: Array<{ event: string; count: number }>;
  } {
    const uniqueUsers = new Set(this.events.filter((e) => e.userId).map((e) => e.userId)).size;

    const eventCounts = this.events.reduce(
      (acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    return {
      totalEvents: this.events.length,
      uniqueUsers,
      topEvents,
    };
  }
}

export const analytics = new AnalyticsService();
