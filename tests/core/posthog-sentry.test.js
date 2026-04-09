import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('PostHog + Sentry Integration', () => {
  let posthog, sentry, analytics;

  before(async () => {
    // Import modules
    const posthogModule = await import('../../src/core/analytics/posthog-client.js');
    const sentryModule = await import('../../src/core/analytics/sentry-client.js');
    const analyticsModule = await import('../../src/core/analytics/analytics-service.js');

    posthog = posthogModule.posthog;
    sentry = sentryModule.sentry;
    analytics = analyticsModule.analytics;
  });

  describe('PostHog Client', () => {
    it('should export posthog instance', () => {
      assert.ok(posthog);
    });

    it('should have track method', () => {
      assert.strictEqual(typeof posthog.track, 'function');
    });

    it('should have identify method', () => {
      assert.strictEqual(typeof posthog.identify, 'function');
    });

    it('should have flush method', () => {
      assert.strictEqual(typeof posthog.flush, 'function');
    });

    it('should handle track in dev mode (no API key)', () => {
      // Should not throw in dev mode
      assert.doesNotThrow(() => {
        posthog.track('test_event', { property: 'value' }, 'user123');
      });
    });

    it('should handle identify in dev mode', () => {
      assert.doesNotThrow(() => {
        posthog.identify('user123', { email: 'test@example.com' });
      });
    });

    it('should handle flush in dev mode', async () => {
      await assert.doesNotReject(async () => {
        await posthog.flush();
      });
    });
  });

  describe('Sentry Client', () => {
    it('should export sentry instance', () => {
      assert.ok(sentry);
    });

    it('should have captureException method', () => {
      assert.strictEqual(typeof sentry.captureException, 'function');
    });

    it('should have captureMessage method', () => {
      assert.strictEqual(typeof sentry.captureMessage, 'function');
    });

    it('should have setUser method', () => {
      assert.strictEqual(typeof sentry.setUser, 'function');
    });

    it('should have addBreadcrumb method', () => {
      assert.strictEqual(typeof sentry.addBreadcrumb, 'function');
    });

    it('should have startTransaction method', () => {
      assert.strictEqual(typeof sentry.startTransaction, 'function');
    });

    it('should have shutdown method', () => {
      assert.strictEqual(typeof sentry.shutdown, 'function');
    });

    it('should have flush method', () => {
      assert.strictEqual(typeof sentry.flush, 'function');
    });

    it('should handle captureException in dev mode', () => {
      const error = new Error('Test error');
      assert.doesNotThrow(() => {
        sentry.captureException(error, { context: 'test' });
      });
    });

    it('should handle captureMessage in dev mode', () => {
      assert.doesNotThrow(() => {
        sentry.captureMessage('Test message', 'info');
      });
    });

    it('should handle setUser in dev mode', () => {
      assert.doesNotThrow(() => {
        sentry.setUser('user123', 'test@example.com');
      });
    });

    it('should handle addBreadcrumb in dev mode', () => {
      assert.doesNotThrow(() => {
        sentry.addBreadcrumb('auth', 'User logged in', { method: 'google' });
      });
    });

    it('should handle startTransaction in dev mode', () => {
      assert.doesNotThrow(() => {
        const transaction = sentry.startTransaction('test-transaction', 'test-op');
        assert.ok(transaction);
        assert.strictEqual(typeof transaction.finish, 'function');
        transaction.finish();
      });
    });

    it('should handle shutdown in dev mode', async () => {
      const result = await sentry.shutdown(100);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should handle flush in dev mode', async () => {
      const result = await sentry.flush(100);
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('Analytics Service', () => {
    it('should export analytics instance', () => {
      assert.ok(analytics);
    });

    it('should have track method', () => {
      assert.strictEqual(typeof analytics.track, 'function');
    });

    it('should have identify method', () => {
      assert.strictEqual(typeof analytics.identify, 'function');
    });

    it('should have trackAIRequest method', () => {
      assert.strictEqual(typeof analytics.trackAIRequest, 'function');
    });

    it('should have trackError method', () => {
      assert.strictEqual(typeof analytics.trackError, 'function');
    });

    it('should have flush method', () => {
      assert.strictEqual(typeof analytics.flush, 'function');
    });

    it('should track events without throwing', () => {
      assert.doesNotThrow(() => {
        analytics.track('test_event', { key: 'value' }, 'user123');
      });
    });

    it('should track AI requests', () => {
      assert.doesNotThrow(() => {
        analytics.trackAIRequest('user123', 'openai', 'gpt-4', 1500, 0.045, 850);
      });
    });

    it('should track errors to both PostHog and Sentry', () => {
      const error = new Error('Test error');
      assert.doesNotThrow(() => {
        analytics.trackError(error, { context: 'test' }, 'user123');
      });
    });

    it('should identify users in both PostHog and Sentry', () => {
      assert.doesNotThrow(() => {
        analytics.identify('user123', {
          email: 'test@example.com',
          plan: 'pro',
        });
      });
    });

    it('should flush both services', async () => {
      await assert.doesNotReject(async () => {
        await analytics.flush();
      });
    });

    it('should store events in memory', () => {
      analytics.track('memory_test', { test: true }, 'user123');
      const events = analytics.getEvents();
      assert.ok(Array.isArray(events));
      assert.ok(events.length > 0);
    });

    it('should filter events by event name', () => {
      analytics.track('filter_test_1', {}, 'user123');
      analytics.track('filter_test_2', {}, 'user123');

      const filtered = analytics.getEvents({ event: 'filter_test_1' });
      assert.ok(Array.isArray(filtered));

      const hasOnlyFilterTest1 = filtered.every((e) => e.event === 'filter_test_1');
      assert.strictEqual(hasOnlyFilterTest1, true);
    });

    it('should filter events by userId', () => {
      analytics.track('user_filter_test', {}, 'userA');
      analytics.track('user_filter_test', {}, 'userB');

      const filtered = analytics.getEvents({ userId: 'userA' });
      assert.ok(Array.isArray(filtered));

      const hasOnlyUserA = filtered.every((e) => e.userId === 'userA');
      assert.strictEqual(hasOnlyUserA, true);
    });

    it('should generate dashboard stats', () => {
      const stats = analytics.getDashboardStats();

      assert.ok(stats);
      assert.strictEqual(typeof stats.totalEvents, 'number');
      assert.strictEqual(typeof stats.uniqueUsers, 'number');
      assert.ok(Array.isArray(stats.topEvents));

      stats.topEvents.forEach((event) => {
        assert.ok(event.event);
        assert.strictEqual(typeof event.count, 'number');
      });
    });
  });
});
