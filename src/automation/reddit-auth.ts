import Snoowrap from 'snoowrap';

const ONE_MINUTE_MS = 60_000;
const REQUESTS_PER_MINUTE = 60;
const SAFE_REQUEST_BUDGET = 58;
const MAX_RETRIES = 4;
const TOKEN_TTL_MS = 55 * ONE_MINUTE_MS;

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export interface RateLimitSnapshot {
  remaining: number | null;
  resetEpochSeconds: number | null;
  trackedCallsInLastMinute: number;
}

export class RedditAuth {
  private requester: Snoowrap | null = null;

  private tokenExpiresAt = 0;

  private readonly requestTimestamps: number[] = [];

  private requestQueue: Promise<void> = Promise.resolve();

  private currentRateLimit: RateLimitSnapshot = {
    remaining: null,
    resetEpochSeconds: null,
    trackedCallsInLastMinute: 0,
  };

  constructor(private readonly userAgent = 'ultra-dex:reddit-scraper:v1.0.0 (by /u/ultra-dex)') {}

  async authenticate(force = false): Promise<Snoowrap> {
    if (!force && this.requester && Date.now() < this.tokenExpiresAt - ONE_MINUTE_MS) {
      return this.requester;
    }

    const credentials = this.loadCredentials();
    const client = new Snoowrap({
      userAgent: this.userAgent,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      username: credentials.username,
      password: credentials.password,
    });

    client.config({
      continueAfterRatelimitError: true,
      requestDelay: 0,
    });

    await client.getMe();
    this.requester = client;
    this.tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
    return client;
  }

  getRateLimitStatus(): RateLimitSnapshot {
    this.refreshTrackedRequestCount();
    return { ...this.currentRateLimit };
  }

  async request(
    label: string,
    operation: (client: Snoowrap) => Promise<unknown>
  ): Promise<unknown> {
    const task = async (): Promise<unknown> => {
      await this.enforceLocalRateLimit();
      return this.executeWithRetry(label, operation);
    };

    const resultPromise = this.requestQueue.then(task, task);
    this.requestQueue = resultPromise.then(
      () => Promise.resolve(),
      () => Promise.resolve()
    );

    return resultPromise;
  }

  private loadCredentials(): RedditCredentials {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;

    if (!clientId || !clientSecret || !username || !password) {
      throw new Error(
        'Missing Reddit credentials. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD.'
      );
    }

    return { clientId, clientSecret, username, password };
  }

  private async executeWithRetry<T>(
    label: string,
    operation: (client: Snoowrap) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      const client = await this.authenticate(attempt > 0);
      this.recordRequest();

      try {
        const value = await operation(client);
        this.captureAndLogRateLimitHeaders(label, client);
        return value;
      } catch (error) {
        lastError = error;
        const statusCode = this.extractStatusCode(error);
        this.captureAndLogRateLimitHeaders(`${label}:error`, client);

        if (statusCode === 429) {
          await delay(this.backoffMs(attempt, 1_500));
          continue;
        }

        if (statusCode === 403) {
          this.requester = null;
          this.tokenExpiresAt = 0;
          await delay(this.backoffMs(attempt, 1_000));
          continue;
        }

        if (statusCode >= 500 && statusCode < 600) {
          await delay(this.backoffMs(attempt, 1_200));
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Reddit request failed after retries (${label}): ${String(lastError)}`);
  }

  private async enforceLocalRateLimit(): Promise<void> {
    this.refreshTrackedRequestCount();

    if (this.requestTimestamps.length >= SAFE_REQUEST_BUDGET) {
      const oldest = this.requestTimestamps[0];
      const waitMs = oldest + ONE_MINUTE_MS - Date.now();
      if (waitMs > 0) {
        await delay(waitMs);
      }
      this.refreshTrackedRequestCount();
    }

    if (
      this.currentRateLimit.remaining !== null &&
      this.currentRateLimit.remaining <= 1 &&
      this.currentRateLimit.resetEpochSeconds
    ) {
      const resetMs = this.currentRateLimit.resetEpochSeconds * 1000;
      const waitMs = resetMs - Date.now();
      if (waitMs > 0) {
        await delay(waitMs);
      }
    }
  }

  private refreshTrackedRequestCount(): void {
    const cutoff = Date.now() - ONE_MINUTE_MS;
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] < cutoff) {
      this.requestTimestamps.shift();
    }

    this.currentRateLimit = {
      ...this.currentRateLimit,
      trackedCallsInLastMinute: this.requestTimestamps.length,
    };
  }

  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
    this.refreshTrackedRequestCount();
  }

  private captureAndLogRateLimitHeaders(label: string, client: Snoowrap): void {
    const remaining =
      typeof client.ratelimitRemaining === 'number' ? client.ratelimitRemaining : null;
    const resetEpochSeconds =
      typeof client.ratelimitExpiration === 'number' ? client.ratelimitExpiration : null;

    this.currentRateLimit = {
      remaining,
      resetEpochSeconds,
      trackedCallsInLastMinute: this.requestTimestamps.length,
    };

    console.info(
      `[reddit-rate-limit] ${label} remaining=${String(remaining)} reset=${String(
        resetEpochSeconds
      )} tracked=${this.requestTimestamps.length}/${REQUESTS_PER_MINUTE}`
    );
  }

  private extractStatusCode(error: unknown): number {
    if (typeof error !== 'object' || error === null) {
      return 0;
    }

    const value = error as {
      statusCode?: number;
      status?: number;
      response?: { statusCode?: number; status?: number };
    };
    return (
      value.statusCode ?? value.status ?? value.response?.statusCode ?? value.response?.status ?? 0
    );
  }

  private backoffMs(attempt: number, baseMs: number): number {
    const jitter = Math.floor(Math.random() * 250);
    return baseMs * 2 ** attempt + jitter;
  }
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}
