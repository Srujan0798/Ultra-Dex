import * as Sentry from '@sentry/node';

/**
 * SentryClient class wrapping @sentry/node SDK
 */
export class SentryClient {
  private enabled: boolean = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
    const release = process.env.npm_package_version;

    if (dsn) {
      this.init(dsn, environment, release);
    } else {
      console.log('[Sentry] SENTRY_DSN not set - running in development mode (logging to console)');
    }
  }

  /**
   * Initialize Sentry with the provided configuration
   */
  init(dsn: string, environment: string = 'development', release?: string): void {
    try {
      Sentry.init({
        dsn,
        environment,
        release,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      });
      this.enabled = true;
      console.log(`[Sentry] Initialized in ${environment} mode`);
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
      this.enabled = false;
    }
  }

  /**
   * Capture an exception with optional context and tags
   */
  captureException(
    error: unknown,
    context?: Record<string, unknown>,
    tags?: Record<string, string>
  ): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] captureException:', error, { context, tags });
      return;
    }

    const normalizedError = error instanceof Error ? error : new Error(String(error));

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional_context', context);
      }
      if (tags) {
        Object.entries(tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      Sentry.captureException(normalizedError);
    });
  }

  /**
   * Capture a message with a specific severity level
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.enabled) {
      console.log(`[Sentry Dev] captureMessage (${level}):`, message);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Set the current user context
   */
  setUser(userId: string, email?: string): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] setUser:', { userId, email });
      return;
    }

    Sentry.setUser({ id: userId, email });
  }

  /**
   * Add a breadcrumb to the current scope
   */
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    if (!this.enabled) {
      console.log('[Sentry Dev] addBreadcrumb:', { category, message, data });
      return;
    }

    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string) {
    if (!this.enabled) {
      console.log('[Sentry Dev] startTransaction:', { name, op });
      return {
        finish: () => console.log('[Sentry Dev] Transaction finished'),
        setStatus: (status: string) =>
          console.log(`[Sentry Dev] Transaction status set to ${status}`),
      };
    }

    return Sentry.startTransaction({ name, op });
  }

  /**
   * Flush and close the Sentry SDK
   */
  async shutdown(timeout: number = 2000): Promise<boolean> {
    if (!this.enabled) {
      console.log('[Sentry Dev] shutdown (no-op)');
      return true;
    }

    try {
      return await Sentry.close(timeout);
    } catch (error) {
      console.error('[Sentry] Error during shutdown:', error);
      return false;
    }
  }

  /**
   * Manual flush of pending events
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.enabled) return true;
    return await Sentry.flush(timeout);
  }
}

// Export a singleton instance for global use
export const sentry = new SentryClient();
export const sentryClient = sentry;
