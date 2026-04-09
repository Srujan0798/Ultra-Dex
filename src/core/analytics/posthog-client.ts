import { PostHog } from 'posthog-node';

export class PostHogClient {
  private client: PostHog | null = null;
  private enabled = false;

  constructor() {
    this.init(process.env.POSTHOG_API_KEY, process.env.POSTHOG_HOST);
  }

  init(apiKey?: string, host = 'https://app.posthog.com'): boolean {
    const key = apiKey || process.env.POSTHOG_API_KEY;
    if (!key) {
      this.client = null;
      this.enabled = false;
      return false;
    }

    this.client = new PostHog(key, { host });
    this.enabled = true;
    return true;
  }

  track(event: string, properties: Record<string, unknown> = {}, userId?: string): void {
    if (!this.enabled || !this.client) {
      return;
    }

    this.client.capture({
      distinctId: userId || 'anonymous',
      event,
      properties,
    });
  }

  identify(userId: string, traits: Record<string, unknown> = {}): void {
    if (!this.enabled || !this.client) {
      return;
    }

    this.client.identify({
      distinctId: userId,
      properties: traits,
    });
  }

  async flush(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return true;
    }

    await this.client.flush();
    return true;
  }

  async shutdown(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return true;
    }

    await this.client.shutdown();
    return true;
  }

  async trackEvent(
    userId: string,
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    this.track(event, properties, userId);
  }

  async identifyUser(userId: string, traits: Record<string, unknown>): Promise<void> {
    this.identify(userId, traits);
  }

  async trackPageView(userId: string, url: string): Promise<void> {
    this.track('$pageview', { $current_url: url }, userId);
  }

  async trackAIRequest(
    userId: string,
    provider: string,
    model: string,
    tokens: number,
    latency: number
  ): Promise<void> {
    this.track('ai_request', { provider, model, tokens, latency }, userId);
  }

  async trackBillingEvent(userId: string, event: string, amount: number): Promise<void> {
    this.track('billing_event', { billing_event: event, amount }, userId);
  }
}

export const posthog = new PostHogClient();
export const posthogClient = posthog;
