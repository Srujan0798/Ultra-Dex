import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { UltraDex } from '../src/client.js';
import { Agent } from '../src/agent.js';
import { BaseProvider, assertProviderContract } from '../src/provider.js';
import { SmartRouter, ProviderStats, CircuitBreaker } from '../src/router.js';
import {
  MiddlewarePipeline,
  loggingMiddleware,
  retryMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
} from '../src/middleware.js';

// ---------------------------------------------------------------------------
// Test Helpers — mock providers
// ---------------------------------------------------------------------------

function createMockProvider(overrides = {}) {
  return {
    async chat(messages, opts) {
      return {
        role: 'assistant',
        content: 'Hello!',
        usage: { promptTokens: 10, completionTokens: 20 },
      };
    },
    async *stream(messages, opts) {
      yield { delta: 'Hello' };
      yield { delta: '!' };
    },
    async embed(text, opts) {
      return { embedding: [0.1, 0.2, 0.3] };
    },
    ...overrides,
  };
}

function createFailingProvider(failCount = 1) {
  let calls = 0;
  return {
    async chat(messages, opts) {
      calls++;
      if (calls <= failCount) throw new Error(`Provider failed (attempt ${calls})`);
      return {
        role: 'assistant',
        content: 'Recovered!',
        usage: { promptTokens: 5, completionTokens: 10 },
      };
    },
    async *stream() {
      yield { delta: 'x' };
    },
    async embed() {
      return { embedding: [0] };
    },
  };
}

function createSlowProvider(delayMs) {
  return {
    async chat() {
      await new Promise((r) => setTimeout(r, delayMs));
      return {
        role: 'assistant',
        content: 'slow',
        usage: { promptTokens: 5, completionTokens: 5 },
      };
    },
    async *stream() {
      yield { delta: 'slow' };
    },
    async embed() {
      return { embedding: [0] };
    },
  };
}

// ===========================================================================
// UltraDex Client
// ===========================================================================

describe('UltraDex Client', () => {
  let dex;

  beforeEach(() => {
    dex = new UltraDex({ defaultProvider: 'mock' });
  });

  it('should create with default config', () => {
    const d = new UltraDex();
    assert.equal(d.config.timeoutMs, 45000);
    assert.equal(d.providers.size, 0);
  });

  it('should reject invalid baseUrl', () => {
    assert.throws(() => new UltraDex({ baseUrl: 123 }), /baseUrl must be a string/);
  });

  it('should reject invalid defaultProvider', () => {
    assert.throws(() => new UltraDex({ defaultProvider: 42 }), /defaultProvider must be a string/);
  });

  it('should register and list providers', () => {
    const p = createMockProvider();
    dex.registerProvider('mock', p);
    assert.deepStrictEqual(dex.listProviders(), ['mock']);
    assert.strictEqual(dex.getProvider('mock'), p);
  });

  it('should reject provider with empty name', () => {
    assert.throws(() => dex.registerProvider('', createMockProvider()), /non-empty string/);
  });

  it('should reject provider missing required methods', () => {
    assert.throws(() => dex.registerProvider('bad', { chat() {} }), /missing required methods/);
  });

  it('should register and list agents', () => {
    const agent = new Agent({ id: 'a1', name: 'Test Agent' });
    dex.registerAgent(agent);
    const list = dex.listAgents();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'a1');
  });

  it('should reject non-Agent in registerAgent', () => {
    assert.throws(() => dex.registerAgent({}), /expects an Agent instance/);
  });

  it('should chat via direct provider', async () => {
    dex.registerProvider('mock', createMockProvider());
    const result = await dex.chat([{ role: 'user', content: 'Hi' }]);
    assert.equal(result.content, 'Hello!');
  });

  it('should throw when no provider selected', async () => {
    const d = new UltraDex();
    await assert.rejects(() => d.chat([]), /no provider selected/);
  });

  it('should stream via direct provider', async () => {
    dex.registerProvider('mock', createMockProvider());
    const chunks = [];
    for await (const chunk of dex.stream([{ role: 'user', content: 'Hi' }])) {
      chunks.push(chunk);
    }
    assert.equal(chunks.length, 2);
  });

  it('should embed via direct provider', async () => {
    dex.registerProvider('mock', createMockProvider());
    const result = await dex.embed('test text');
    assert.deepStrictEqual(result.embedding, [0.1, 0.2, 0.3]);
  });

  it('should enable router and route chat through it', async () => {
    dex.registerProvider('mock', createMockProvider());
    dex.enableRouter({ strategy: 'fallback-chain' });
    const result = await dex.chat([{ role: 'user', content: 'Hi' }]);
    assert.equal(result.content, 'Hello!');
  });

  it('should expose router stats after routing', async () => {
    dex.registerProvider('mock', createMockProvider());
    dex.enableRouter({ strategy: 'fastest' });
    await dex.chat([{ role: 'user', content: 'Hi' }]);
    const stats = dex.getRouterStats();
    assert.ok(stats.mock);
    assert.equal(stats.mock.requestCount, 1);
  });
});

// ===========================================================================
// Agent
// ===========================================================================

describe('Agent', () => {
  it('should require a string id', () => {
    assert.throws(() => new Agent(), /non-empty string id/);
    assert.throws(() => new Agent({ id: '' }), /non-empty string id/);
  });

  it('should describe itself', () => {
    const a = new Agent({ id: 'test', name: 'Test', description: 'desc', capabilities: ['code'] });
    const d = a.describe();
    assert.equal(d.id, 'test');
    assert.equal(d.name, 'Test');
    assert.deepStrictEqual(d.capabilities, ['code']);
  });

  it('should remember and recall', () => {
    const a = new Agent({ id: 'test' });
    a.remember('key1', 'value1');
    assert.equal(a.recall('key1'), 'value1');
    assert.equal(a.recall('missing'), undefined);
  });

  it('should clear memory', () => {
    const a = new Agent({ id: 'test' });
    a.remember('k', 'v');
    a.clearMemory();
    assert.equal(a.recall('k'), undefined);
  });

  it('should throw on unimplemented run()', async () => {
    const a = new Agent({ id: 'test' });
    await assert.rejects(() => a.run('task', {}), /must implement async run/);
  });
});

// ===========================================================================
// BaseProvider
// ===========================================================================

describe('BaseProvider', () => {
  it('should throw on unimplemented chat()', async () => {
    const p = new BaseProvider();
    await assert.rejects(() => p.chat(), /must implement chat/);
  });

  it('should throw on unimplemented embed()', async () => {
    const p = new BaseProvider();
    await assert.rejects(() => p.embed(), /must implement embed/);
  });

  it('should validate provider contract', () => {
    assert.throws(() => assertProviderContract('bad', null), /must be an object/);
    assert.throws(() => assertProviderContract('bad', { chat() {} }), /missing required methods/);
    assert.doesNotThrow(() => assertProviderContract('good', createMockProvider()));
  });
});

// ===========================================================================
// SmartRouter
// ===========================================================================

describe('SmartRouter', () => {
  let router;

  beforeEach(() => {
    router = new SmartRouter({
      strategy: 'fallback-chain',
      costPerToken: { fast: 0.00003, slow: 0.00001 },
    });
    router.addProvider('fast', createSlowProvider(10));
    router.addProvider('slow', createSlowProvider(50));
  });

  it('should select provider by fallback order', () => {
    const selected = router.selectProvider();
    assert.equal(selected, 'fast');
  });

  it('should route requests and record latency', async () => {
    const msgs = [{ role: 'user', content: 'Hi' }];
    const result = await router.route('chat', [msgs, {}]);
    assert.equal(result.provider, 'fast');
    assert.ok(result.latencyMs >= 0);

    const stats = router.getStats('fast');
    assert.equal(stats.requestCount, 1);
    assert.ok(stats.p50 >= 0);
  });

  it('should fallback when first provider fails', async () => {
    router = new SmartRouter({ strategy: 'fallback-chain' });
    router.addProvider('broken', createFailingProvider(999));
    router.addProvider('backup', createMockProvider());

    const result = await router.route('chat', [[{ role: 'user', content: 'Hi' }], {}]);
    assert.equal(result.provider, 'backup');
  });

  it('should throw when all providers fail', async () => {
    router = new SmartRouter({ strategy: 'fallback-chain' });
    router.addProvider('fail1', createFailingProvider(999));
    router.addProvider('fail2', createFailingProvider(999));

    await assert.rejects(
      () => router.route('chat', [[{ role: 'user', content: 'Hi' }], {}]),
      /all providers failed/
    );
  });

  it('should enforce budget limit', async () => {
    router = new SmartRouter({ strategy: 'fallback-chain', budgetLimit: 0 });
    router.addProvider('mock', createMockProvider());

    await assert.rejects(
      () => router.route('chat', [[{ role: 'user', content: 'Hi' }], {}]),
      /budget limit reached/
    );
  });

  it('should track total cost and requests', async () => {
    const msgs = [{ role: 'user', content: 'Hi' }];
    await router.route('chat', [msgs, {}]);
    await router.route('chat', [msgs, {}]);

    assert.equal(router.totalRequests, 2);
    const allStats = router.getAllStats();
    assert.ok(allStats.fast);
    assert.ok(allStats.slow);
  });

  it('should remove a provider', () => {
    router.removeProvider('slow');
    assert.equal(router.entries.size, 1);
    assert.equal(router.selectProvider(), 'fast');
  });
});

describe('SmartRouter Strategies', () => {
  it('round-robin should rotate providers', () => {
    const router = new SmartRouter({ strategy: 'round-robin' });
    router.addProvider('a', createMockProvider());
    router.addProvider('b', createMockProvider());
    router.addProvider('c', createMockProvider());

    const selections = [
      router.selectProvider(),
      router.selectProvider(),
      router.selectProvider(),
      router.selectProvider(),
    ];
    assert.equal(selections[0], 'a');
    assert.equal(selections[1], 'b');
    assert.equal(selections[2], 'c');
    assert.equal(selections[3], 'a'); // wraps around
  });

  it('cheapest should pick lowest cost-per-token', () => {
    const router = new SmartRouter({
      strategy: 'cheapest',
      costPerToken: { expensive: 0.01, cheap: 0.001 },
    });
    router.addProvider('expensive', createMockProvider());
    router.addProvider('cheap', createMockProvider());

    assert.equal(router.selectProvider(), 'cheap');
  });
});

describe('CircuitBreaker', () => {
  it('should start closed', () => {
    const cb = new CircuitBreaker();
    assert.equal(cb.state, 'closed');
    assert.equal(cb.isAvailable, true);
  });

  it('should trip after threshold failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure();
    assert.equal(cb.isAvailable, true);
    cb.recordFailure();
    assert.equal(cb.state, 'open');
    assert.equal(cb.isAvailable, false);
  });

  it('should reset on success', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 });
    cb.recordFailure();
    cb.recordSuccess();
    assert.equal(cb.state, 'closed');
    assert.equal(cb.failures, 0);
  });
});

describe('ProviderStats', () => {
  it('should track latencies and compute percentiles', () => {
    const stats = new ProviderStats();
    for (let i = 1; i <= 100; i++) stats.recordLatency(i);

    assert.equal(stats.p50, 50);
    assert.equal(stats.p95, 95);
    assert.equal(stats.p99, 99);
    assert.equal(stats.requestCount, 100);
  });

  it('should track errors and error rate', () => {
    const stats = new ProviderStats();
    stats.recordLatency(10);
    stats.recordError();

    assert.equal(stats.errorCount, 1);
    assert.equal(stats.requestCount, 2);
    assert.equal(stats.errorRate, 0.5);
  });

  it('should track cost', () => {
    const stats = new ProviderStats();
    stats.recordCost(1000, 0.03);
    stats.recordCost(2000, 0.06);

    const snap = stats.snapshot();
    assert.equal(snap.totalTokens, 3000);
    assert.equal(snap.totalCost, 0.09);
  });
});

// ===========================================================================
// Middleware
// ===========================================================================

describe('MiddlewarePipeline', () => {
  it('should execute middleware in order', async () => {
    const order = [];
    const pipeline = new MiddlewarePipeline();
    pipeline.use('first', async (ctx, next) => {
      order.push(1);
      await next();
      order.push(4);
    });
    pipeline.use('second', async (ctx, next) => {
      order.push(2);
      await next();
      order.push(3);
    });

    await pipeline.execute({});
    assert.deepStrictEqual(order, [1, 2, 3, 4]);
  });

  it('should list middleware names', () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use('a', async (ctx, next) => next());
    pipeline.use('b', async (ctx, next) => next());
    assert.deepStrictEqual(pipeline.list(), ['a', 'b']);
  });

  it('should report length', () => {
    const pipeline = new MiddlewarePipeline();
    assert.equal(pipeline.length, 0);
    pipeline.use('x', async (ctx, next) => next());
    assert.equal(pipeline.length, 1);
  });
});

describe('loggingMiddleware', () => {
  it('should record latency and success', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(loggingMiddleware());
    pipeline.use(async (ctx, next) => {
      ctx.result = { text: 'ok' };
    });

    const ctx = { method: 'chat', provider: 'test' };
    await pipeline.execute(ctx);

    assert.ok(ctx.log);
    assert.equal(ctx.log.success, true);
    assert.ok(ctx.log.latencyMs >= 0);
    assert.equal(ctx.log.provider, 'test');
  });
});

describe('cacheMiddleware', () => {
  it('should cache and return cached results', async () => {
    let callCount = 0;
    const pipeline = new MiddlewarePipeline();
    pipeline.use(cacheMiddleware({ ttlMs: 5000 }));
    pipeline.use(async (ctx, next) => {
      callCount++;
      ctx.result = { text: 'fresh' };
    });

    const ctx1 = { method: 'chat', args: ['hello'] };
    await pipeline.execute(ctx1);
    assert.equal(callCount, 1);
    assert.equal(ctx1.cached, false);

    const ctx2 = { method: 'chat', args: ['hello'] };
    await pipeline.execute(ctx2);
    assert.equal(callCount, 1); // Not called again
    assert.equal(ctx2.cached, true);
    assert.equal(ctx2.result.text, 'fresh');
  });
});

describe('rateLimitMiddleware', () => {
  it('should throw when rate limit exceeded', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(rateLimitMiddleware({ maxRequests: 2, windowMs: 60000 }));
    pipeline.use(async (ctx, next) => {
      ctx.result = 'ok';
    });

    await pipeline.execute({});
    await pipeline.execute({});
    await assert.rejects(() => pipeline.execute({}), /Rate limit exceeded/);
  });
});
