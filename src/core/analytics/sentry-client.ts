import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';

class SentryClient {
  private enabled: boolean = false;

  constructor() {
    if (SENTRY_DSN) {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: NODE_ENV,
        release: process.env.npm_package_version,
        tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0
      });
      this.enabled = true;
    } else {
      console.log('[Sentry] No DSN found - running in dev mode (no-op)');
    }
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] captureException:', error, context);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Set the current user
   */
  setUser(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] setUser:', userId, traits);
      return;
    }

    Sentry.setUser({
      id: userId,
      ...traits
    });
  }

  /**
   * Clear the current user
   */
  clearUser(): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] clearUser');
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Flush pending events
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.enabled) {
      console.log('[Sentry Dev] flush: no-op');
      return true;
    }

    return await Sentry.close(timeout);
  }
}

export const sentry = new SentryClient();
