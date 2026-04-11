import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { UsageMeter } from '../../src/core/billing/usage-meter.js';
import { getPostgresClient } from '../../src/core/database/postgres-client.js';

describe('Usage Persistence Integration', () => {
  let usageMeter;
  const isPostgresAvailable = process.env.DATABASE_URL;

  before(async () => {
    usageMeter = new UsageMeter();
  });

  after(async () => {
    const client = getPostgresClient();
    if (!client.isFallbackMode()) {
      // Cleanup test data
      await client.query("DELETE FROM usage_events WHERE user_id LIKE 'test-user-%'");
    }
  });

  it('should track usage and persist to Postgres (or fallback to memory)', async (t) => {
    const userId = `test-user-${Date.now()}`;
    await usageMeter.trackUsage(userId, 'api_call', { tokens: 500, provider: 'openai', model: 'gpt-4' });
    
    // Memory check
    const usage = usageMeter.getUsage(userId);
    assert.strictEqual(usage.requestCount, 1);
    assert.strictEqual(usage.tokenCount, 500);

    // Postgres check
    const client = getPostgresClient();
    await client.init();
    if (client.isFallbackMode()) {
      return t.skip('Postgres not available, skipping DB persistence check');
    }

    const dbUsage = await usageMeter.getUsageFromDB(userId);
    assert.strictEqual(dbUsage.requests, 1);
    assert.strictEqual(dbUsage.tokens, 500);
  });

  it('should aggregate usage by date range in Postgres', async (t) => {
    const client = getPostgresClient();
    await client.init();
    if (client.isFallbackMode()) {
      return t.skip('Postgres not available, skipping date-range aggregation check');
    }

    const userId = `test-user-range-${Date.now()}`;
    const now = Date.now();

    // Track some usage
    await usageMeter.trackUsage(userId, 'api_call', { tokens: 100 });
    
    // Check range including today
    const usageToday = await usageMeter.getUsageFromDB(userId, { since: now - 10000, until: now + 10000 });
    assert.strictEqual(usageToday.requests, 1);
    assert.strictEqual(usageToday.tokens, 100);

    // Check range in the past
    const usagePast = await usageMeter.getUsageFromDB(userId, { since: now - 20000, until: now - 10000 });
    assert.strictEqual(usagePast.requests, 0);
  });

  it('should check limits with real tier limits (Free Plan)', async () => {
    const userId = 'free-user';
    usageMeter.setPlan(userId, 'free');
    
    usageMeter.resetUser(userId);
    usageMeter.increment(userId, { requests: 99, tokens: 9000 });
    
    let result = usageMeter.checkLimit(userId);
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining.requests, 1);

    usageMeter.increment(userId, { requests: 2 });
    result = usageMeter.checkLimit(userId);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.remaining.requests, 0);
  });

  it('should fallback to in-memory mode when DATABASE_URL not set', async () => {
    // Force a local instance that we know doesn't have Postgres if we delete the env
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    
    try {
      const localMeter = new UsageMeter();
      const userId = 'local-user';
      
      await localMeter.trackUsage(userId, 'api_call', { tokens: 5 });
      const usage = localMeter.getUsage(userId);
      assert.strictEqual(usage.requestCount, 1);
      assert.strictEqual(usage.tokenCount, 5);
      
      // Should not throw even if Postgres init fails internally
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  });
});
