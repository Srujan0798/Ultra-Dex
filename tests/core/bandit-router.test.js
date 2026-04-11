import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { ThompsonSamplingRouter } from '../../src/core/routing/bandit-router.ts';

describe('ThompsonSamplingRouter', () => {
  let router;

  before(() => {
    router = new ThompsonSamplingRouter();
  });

  it('should select a valid provider', () => {
    const result = router.selectProvider({ task: 'test task' }, {});
    assert.ok(['claude', 'openai', 'gemini', 'nvidia'].includes(result.provider));
    assert.ok(['exploration', 'exploitation', 'manual'].includes(result.strategy));
  });

  it('should update stats after execution', () => {
    router.updateStats('nvidia', {
      success: true,
      costUsd: 0.001,
      latencyMs: 100,
      tokensUsed: 500,
    });
    const stats = router.getProviderStats();
    assert.ok(stats.has('nvidia'));
    assert.strictEqual(stats.get('nvidia').getTotalCalls(), 1);
  });

  it('should prefer cheaper providers with cost constraint', () => {
    const router2 = new ThompsonSamplingRouter([
      { name: 'expensive', costPerToken: 0.01 },
      { name: 'cheap', costPerToken: 0.0001 },
    ]);

    // Train the router to prefer the cheap one
    for (let i = 0; i < 20; i++) {
      router2.updateStats('cheap', { success: true, costUsd: 0.0001, latencyMs: 100, tokensUsed: 100 });
      router2.updateStats('expensive', { success: true, costUsd: 0.01, latencyMs: 50, tokensUsed: 100 });
    }

    let cheapCount = 0;
    for (let i = 0; i < 20; i++) {
      const result = router2.selectProvider({ task: 'test' }, { maxCostUsd: 0.001 });
      if (result.provider === 'cheap') cheapCount++;
    }

    assert.ok(cheapCount > 5, `Should prefer cheaper provider, got ${cheapCount}/20`);
  });

  it('should respect maxCost constraint', () => {
    const result = router.selectProvider({ task: 'test' }, { maxCostUsd: 0.001 });
    assert.ok(result.provider);
    assert.ok(result.strategy);
  });

  it('should return estimated success rates', () => {
    const rates = router.getEstimatedSuccessRates();
    assert.ok(typeof rates === 'object');
    assert.ok(Object.keys(rates).length > 0);
  });

  it('should return selection counts', () => {
    const counts = router.getSelectionCounts();
    assert.ok(typeof counts === 'object');
  });

  it('should reset provider stats', () => {
    router.reset();
    const rates = router.getEstimatedSuccessRates();
    // After reset, all should be near 0.5 (prior)
    for (const [, rate] of Object.entries(rates)) {
      assert.ok(rate >= 0.4 && rate <= 0.6, `Rate ${rate} should be near 0.5 after reset`);
    }
  });

  it('should get cost savings', () => {
    const savings = router.getCostSavings();
    assert.ok(typeof savings === 'number');
    assert.ok(savings >= 0);
  });

  it('should get provider cost breakdown', () => {
    const breakdown = router.getProviderCostBreakdown();
    assert.ok(typeof breakdown === 'object');
  });
});
