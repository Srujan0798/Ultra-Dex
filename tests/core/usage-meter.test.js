import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('Usage Meter', () => {
  let usageMeter;

  before(async () => {
    const module = await import('../../src/core/billing/usage-meter.js');
    usageMeter = module.usageMeter;
  });

  it('should track usage and increment counts', () => {
    const userId = 'user-track-test';
    usageMeter.resetUser(userId);

    usageMeter.increment(userId, { requests: 5, tokens: 500 });

    const usage = usageMeter.getUsage(userId);
    assert.strictEqual(usage.requestCount, 5);
    assert.strictEqual(usage.tokenCount, 500);
  });

  it('should check limits correctly for free plan', () => {
    const userId = 'user-limit-test';
    usageMeter.resetUser(userId);

    // Free plan limit is 100 requests (from pricing-tiers.ts)
    const result = usageMeter.checkLimit(userId, 'free');
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining.requests, 100);

    // Increment to limit
    usageMeter.increment(userId, { requests: 100 });

    const overLimit = usageMeter.checkLimit(userId, 'free');
    assert.strictEqual(overLimit.allowed, false);
    assert.strictEqual(overLimit.remaining.requests, 0);
  });

  it('should allow unlimited usage for enterprise plan', () => {
    const userId = 'user-enterprise-test';
    usageMeter.resetUser(userId);

    usageMeter.increment(userId, { requests: 1000000, tokens: 1000000 });

    const result = usageMeter.checkLimit(userId, 'enterprise');
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining.requests, -1);
  });

  it('should reset user counters', () => {
    const userId = 'user-reset-test';
    usageMeter.increment(userId, { requests: 50 });

    usageMeter.resetUser(userId);

    const usage = usageMeter.getUsage(userId);
    assert.strictEqual(usage.requestCount, 0);
  });
});
