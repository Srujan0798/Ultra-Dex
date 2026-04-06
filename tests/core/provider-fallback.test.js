import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  ProviderFallback,
} from '../../src/core/infrastructure/provider-fallback.js';
import { SmartAIRouter } from '../../src/core/ai/router.js';
import providerRegistry, { registerProvider } from '../../src/core/ai/provider-registry.js';

function clearProviderRegistry() {
  providerRegistry.registry.clear();
  providerRegistry.providerMetadata.clear();
  providerRegistry.validationResults.clear();
  providerRegistry.discoveryLoaded = false;
}

describe('Provider fallback infrastructure', () => {
  let fallback;

  beforeEach(() => {
    clearProviderRegistry();
    fallback = new ProviderFallback({ strategy: 'priority' });
    fallback.addProvider('primary', {
      priority: 1,
      costPer1kTokens: 0.03,
      execute: async () => ({ text: 'from-primary' }),
    });
    fallback.addProvider('secondary', {
      priority: 2,
      costPer1kTokens: 0.01,
      execute: async () => ({ text: 'from-secondary' }),
    });
  });

  afterEach(() => {
    clearProviderRegistry();
  });

  it('uses the highest-priority provider when healthy', async () => {
    const result = await fallback.execute({ prompt: 'test' });
    assert.equal(result.provider, 'primary');
    assert.equal(result.result.text, 'from-primary');
  });

  it('fails over when the primary provider circuit is open', async () => {
    fallback.providers.get('primary').circuitBreaker.forceState('OPEN');
    fallback.providers.get('primary').circuitBreaker.openedAt = Date.now();

    const result = await fallback.execute({ prompt: 'test' });
    assert.equal(result.provider, 'secondary');
    assert.ok(result.attemptedProviders.includes('primary'));
    assert.ok(fallback.getStats().failovers > 0);
  });

  it('sorts by cost when strategy is cost-optimized', async () => {
    const costFallback = new ProviderFallback({ strategy: 'cost-optimized' });
    costFallback.addProvider('expensive', {
      priority: 1,
      costPer1kTokens: 0.1,
      execute: async () => ({ text: 'expensive' }),
    });
    costFallback.addProvider('cheap', {
      priority: 2,
      costPer1kTokens: 0.001,
      execute: async () => ({ text: 'cheap' }),
    });

    const result = await costFallback.execute({ prompt: 'test' });
    assert.equal(result.provider, 'cheap');
  });

  it('exposes circuit breaker registry dashboard data', async () => {
    const registry = new CircuitBreakerRegistry();
    const breaker = registry.get('openai');
    breaker.forceState('OPEN');
    breaker.openedAt = Date.now();

    const dashboard = registry.getDashboard();
    assert.equal(dashboard.total, 1);
    assert.equal(dashboard.open, 1);
  });

  it('integrates with SmartAIRouter fallback execution', async () => {
    registerProvider('failing-provider', {
      async chat() {
        throw new Error('primary failed');
      },
      async stream() {
        throw new Error('primary failed');
      },
      async embed() {
        return { embedding: [0.1], dimensions: 1 };
      },
    });
    registerProvider('succeeding-provider', {
      async chat() {
        return { content: 'fallback succeeded' };
      },
      async stream() {
        return { ok: true };
      },
      async embed() {
        return { embedding: [0.2], dimensions: 1 };
      },
    });

    const router = new SmartAIRouter({
      providerFallback: new ProviderFallback({ strategy: 'priority' }),
    });
    router.initialize = async () => {
      router.initialized = true;
    };
    router.pickProviders = () => ['failing-provider', 'succeeding-provider'];

    const result = await router.routeRequest(
      [{ role: 'user', content: 'hello' }],
      'quality',
      { fallback: true }
    );

    assert.equal(result.provider, 'succeeding-provider');
    assert.equal(result.content, 'fallback succeeded');
    assert.equal(
      router.providerFallback.providers.get('failing-provider').circuitBreaker.stats.failure,
      1
    );
  });
});

describe('CircuitBreaker', () => {
  it('opens after reaching the failure threshold', async () => {
    const breaker = new CircuitBreaker({
      name: 'provider-x',
      failureThreshold: 2,
      resetTimeoutMs: 100,
    });

    await assert.rejects(() => breaker.execute(async () => {
      throw new Error('boom');
    }));
    await assert.rejects(() => breaker.execute(async () => {
      throw new Error('boom');
    }));

    assert.equal(breaker.state, 'OPEN');
  });
});
