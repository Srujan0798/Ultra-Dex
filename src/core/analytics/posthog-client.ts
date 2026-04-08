import { PostHog } from 'posthog-node';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';

class PostHogClient {
  private client: PostHog | null = null;
  private enabled: boolean = false;

  constructor() {
    if (POSTHOG_API_KEY) {
      this.client = new PostHog(POSTHOG_API_KEY, {
        host: POSTHOG_HOST,
        flushAt: 100, // Flush after 100 events
        flushInterval: 30000 // Flush every 30 seconds
      });
      this.enabled = true;
    } else {
      console.log('[PostHog] No API key found - running in dev mode (no-op)');
    }
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, unknown>, userId?: string): void {
    if (!this.enabled || !this.client) {
      console.log(`[PostHog Dev] track: ${event}`, { userId, properties });
      return;
    }

    this.client.capture({
      distinctId: userId || 'anonymous',
      event,
      properties
    });
  }

  /**
   * Identify a user with traits
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.client) {
      console.log(`[PostHog Dev] identify: ${userId}`, traits);
      return;
    }

    this.client.identify({
      distinctId: userId,
      properties: traits
    });
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    if (!this.enabled || !this.client) {
      console.log('[PostHog Dev] flush: no-op');
      return;
    }

    await this.client.shutdown();
  }
}

export const posthog = new PostHogClient();
