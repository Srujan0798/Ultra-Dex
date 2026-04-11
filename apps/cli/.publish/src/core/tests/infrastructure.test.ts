// Copyright (c) 2026 Ultra-Dex
// Integration Tests — Streaming Pipeline + Webhook System + Plugin Lifecycle + Rate Limiter

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Streaming Pipeline Tests ────────────────────────────────────────────
import { StreamPipeline, StreamTransform, StreamBuffer } from '../streaming/pipeline.js';

describe('StreamTransform', () => {
  it('should process events through transform function', async () => {
    const t = new StreamTransform({
      name: 'uppercase',
      transform: (e) => ({ ...e, text: e.text.toUpperCase() }),
    });
    const result = await t.process({ text: 'hello' });
    assert.equal(result.text, 'HELLO');
    assert.equal(t.stats.processed, 1);
  });

  it('should filter events when filter returns false', async () => {
    const t = new StreamTransform({
      name: 'filter-test',
      transform: (e) => e,
      filter: (e) => e.type === 'keep',
    });
    const result = await t.process({ type: 'discard' });
    assert.equal(result, null);
    assert.equal(t.stats.filtered, 1);
  });

  it('should handle errors with custom error handler', async () => {
    const t = new StreamTransform({
      name: 'error-handler',
      transform: () => {
        throw new Error('fail');
      },
      errorHandler: (err, e) => ({ ...e, error: err.message }),
    });
    const result = await t.process({ text: 'test' });
    assert.equal(result.error, 'fail');
    assert.equal(t.stats.errors, 1);
  });

  it('should track average processing time', async () => {
    const t = new StreamTransform({
      name: 'timed',
      transform: (e) => e,
    });
    await t.process({ a: 1 });
    await t.process({ b: 2 });
    const stats = t.getStats();
    assert.equal(stats.processed, 2);
    assert.ok(stats.avgMs >= 0);
  });
});

describe('StreamBuffer', () => {
  it('should flush when maxSize is reached', async () => {
    let flushed = null;
    const buf = new StreamBuffer({
      maxSize: 3,
      onFlush: (batch) => {
        flushed = batch;
      },
    });
    buf.add('a');
    buf.add('b');
    assert.equal(flushed, null);
    buf.add('c');
    assert.equal(flushed.length, 3);
    buf.destroy();
  });

  it('should track stats', () => {
    const buf = new StreamBuffer({ maxSize: 100 });
    buf.add('x');
    buf.add('y');
    const stats = buf.getStats();
    assert.equal(stats.bufferSize, 2);
    assert.equal(stats.maxSize, 100);
    buf.destroy();
  });
});

describe('StreamPipeline', () => {
  let pipeline;

  beforeEach(() => {
    pipeline = new StreamPipeline({ name: 'test-pipe' });
  });

  it('should process events through transform chain', async () => {
    pipeline.addTransform({ name: 'add-tag', transform: (e) => ({ ...e, tag: 'processed' }) });
    pipeline.addTransform({ name: 'add-ts', transform: (e) => ({ ...e, processed: true }) });
    pipeline.start();

    const result = await pipeline.ingest({ text: 'hello' });
    assert.equal(result.tag, 'processed');
    assert.equal(result.processed, true);
    assert.equal(pipeline.stats.ingested, 1);
    assert.equal(pipeline.stats.output, 1);
  });

  it('should drop events when not running', async () => {
    const result = await pipeline.ingest({ text: 'dropped' });
    assert.equal(result, null);
    assert.equal(pipeline.stats.dropped, 1);
  });

  it('should send errors to dead letter queue', async () => {
    pipeline.addTransform({
      name: 'fail',
      transform: () => {
        throw new Error('boom');
      },
    });
    pipeline.start();

    await pipeline.ingest({ text: 'error' });
    assert.equal(pipeline.stats.errors, 1);
    const dlq = pipeline.getDeadLetters();
    assert.equal(dlq.length, 1);
    assert.equal(dlq[0].error, 'boom');
  });

  it('should handle batch ingestion', async () => {
    pipeline.addTransform({ name: 'pass', transform: (e) => e });
    pipeline.start();

    const results = await pipeline.ingestBatch([{ a: 1 }, { b: 2 }, { c: 3 }]);
    assert.equal(results.length, 3);
    assert.equal(pipeline.stats.output, 3);
  });

  it('should get comprehensive stats', () => {
    pipeline.addTransform({ name: 'step1', transform: (e) => e });
    const stats = pipeline.getStats();
    assert.equal(stats.name, 'test-pipe');
    assert.equal(stats.transforms.length, 1);
  });

  it('should apply backpressure when limit exceeded', async () => {
    const small = new StreamPipeline({ backpressureLimit: 0 });
    small.addTransform({ name: 'slow', transform: (e) => e });
    small.start();
    // First should work but we hack the counter
    small.stats.ingested = 100;
    small.stats.output = 0;
    const result = await small.ingest({ text: 'blocked' });
    assert.equal(result, null);
    assert.ok(small.stats.dropped > 0);
  });
});

// ── Webhook System Tests ────────────────────────────────────────────────
import { WebhookManager, WebhookEndpoint, WebhookDelivery } from '../webhooks/webhook-manager.js';

describe('WebhookEndpoint', () => {
  it('should match wildcard events', () => {
    const ep = new WebhookEndpoint({ url: 'https://example.com/hook' });
    assert.ok(ep.matchesEvent('anything'));
  });

  it('should match specific events', () => {
    const ep = new WebhookEndpoint({ url: 'https://example.com', events: ['agent.complete'] });
    assert.ok(ep.matchesEvent('agent.complete'));
    assert.ok(!ep.matchesEvent('agent.fail'));
  });

  it('should generate HMAC signature', () => {
    const ep = new WebhookEndpoint({ url: 'https://example.com', secret: 'test-secret' });
    const sig = ep.sign({ foo: 'bar' });
    assert.ok(sig.length > 0);
    // Same payload = same signature
    assert.equal(sig, ep.sign({ foo: 'bar' }));
  });
});

describe('WebhookDelivery', () => {
  it('should track attempt status', () => {
    const d = new WebhookDelivery({ endpointId: 'ep1', event: 'test', payload: {} });
    assert.equal(d.status, 'pending');
    d.recordAttempt(false, null, 'timeout');
    assert.equal(d.status, 'retrying');
    assert.ok(d.canRetry());
  });

  it('should calculate exponential backoff', () => {
    const d = new WebhookDelivery({ endpointId: 'ep1', event: 'test', payload: {} });
    d.recordAttempt(false);
    assert.equal(d.getRetryDelay(), 1000); // 1^2 * 1000
    d.recordAttempt(false);
    assert.equal(d.getRetryDelay(), 4000); // 2^2 * 1000
  });

  it('should mark as failed after max retries', () => {
    const d = new WebhookDelivery({ endpointId: 'ep1', event: 'test', payload: {} });
    d.recordAttempt(false);
    d.recordAttempt(false);
    d.recordAttempt(false);
    assert.equal(d.status, 'failed');
    assert.ok(!d.canRetry());
  });
});

describe('WebhookManager', () => {
  let manager;

  beforeEach(() => {
    manager = new WebhookManager();
  });

  it('should register and list endpoints', () => {
    manager.register({ url: 'https://a.com/hook', events: ['agent.complete'] });
    manager.register({ url: 'https://b.com/hook' });
    assert.equal(manager.listEndpoints().length, 2);
  });

  it('should unregister endpoints', () => {
    const ep = manager.register({ url: 'https://a.com/hook' });
    assert.ok(manager.unregister(ep.id));
    assert.equal(manager.listEndpoints().length, 0);
  });

  it('should dispatch events to matching endpoints', async () => {
    manager.register({ url: 'https://success.com/hook', events: ['task.complete'] });
    const results = await manager.dispatch('task.complete', { taskId: '123' });
    assert.equal(results.length, 1);
    assert.equal(results[0].status, 'delivered');
  });

  it('should not dispatch to inactive endpoints', async () => {
    const ep = manager.register({ url: 'https://a.com/hook', events: ['test'] });
    ep.active = false;
    const results = await manager.dispatch('test', {});
    assert.equal(results.length, 0);
  });

  it('should retry failed deliveries', async () => {
    manager.register({ url: 'https://fail.com/hook', events: ['test'] });
    const results = await manager.dispatch('test', {});
    assert.equal(results[0].status, 'retrying');
    assert.ok(manager.retryQueue.length > 0);
  });

  it('should provide dashboard stats', async () => {
    manager.register({ url: 'https://a.com/hook' });
    await manager.dispatch('test', {});
    const dash = manager.getDashboard();
    assert.equal(dash.endpoints, 1);
    assert.ok(dash.stats.totalSent > 0);
  });
});

// ── Plugin Lifecycle Tests ──────────────────────────────────────────────
import { PluginManager, Plugin } from '../plugins/lifecycle-manager.js';

describe('Plugin', () => {
  it('should initialize and set status to active', async () => {
    let initCalled = false;
    const p = new Plugin({
      name: 'test-plugin',
      hooks: {
        onInit: () => {
          initCalled = true;
        },
      },
    });
    await p.initialize();
    assert.ok(initCalled);
    assert.equal(p.status, 'active');
  });

  it('should execute hooks and track stats', async () => {
    const p = new Plugin({
      name: 'hook-tester',
      hooks: {
        onInit: () => {},
        onProcess: (data) => ({ ...data, processed: true }),
      },
    });
    await p.initialize();
    const result = await p.execute('onProcess', { text: 'hello' });
    assert.equal(result.processed, true);
    assert.equal(p.stats.invocations, 1);
  });

  it('should not execute hooks when inactive', async () => {
    const p = new Plugin({ name: 'inactive', hooks: { onProcess: () => 'ok' } });
    const result = await p.execute('onProcess');
    assert.equal(result, null);
  });

  it('should teardown properly', async () => {
    let destroyed = false;
    const p = new Plugin({
      name: 'teardown-test',
      hooks: {
        onInit: () => {},
        onDestroy: () => {
          destroyed = true;
        },
      },
    });
    await p.initialize();
    await p.teardown();
    assert.ok(destroyed);
    assert.equal(p.status, 'inactive');
  });
});

describe('PluginManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  it('should register and load plugins', async () => {
    manager.register({ name: 'logger', hooks: { onInit: () => {} } });
    await manager.load('logger');
    const list = manager.list({ status: 'active' });
    assert.equal(list.length, 1);
  });

  it('should reject duplicate plugin names', () => {
    manager.register({ name: 'dupe' });
    assert.throws(() => manager.register({ name: 'dupe' }), /already registered/);
  });

  it('should enforce dependency ordering', () => {
    manager.register({ name: 'base', hooks: { onInit: () => {} } });
    // dep not active yet
    assert.throws(() => manager.register({ name: 'child', dependencies: ['base'] }), /not active/);
  });

  it('should execute hooks across all active plugins', async () => {
    manager.register({ name: 'p1', hooks: { onInit: () => {}, onEvent: () => 'from-p1' } });
    manager.register({ name: 'p2', hooks: { onInit: () => {}, onEvent: () => 'from-p2' } });
    await manager.load('p1');
    await manager.load('p2');

    const results = await manager.executeHook('onEvent');
    assert.equal(results.length, 2);
    assert.equal(results[0].result, 'from-p1');
    assert.equal(results[1].result, 'from-p2');
  });

  it('should unload plugins', async () => {
    manager.register({ name: 'removable', hooks: { onInit: () => {} } });
    await manager.load('removable');
    await manager.unload('removable');
    const p = manager.get('removable');
    assert.equal(p.status, 'inactive');
  });

  it('should hot-reload plugins', async () => {
    manager.register({ name: 'reloadable', version: '1.0', hooks: { onInit: () => {} } });
    await manager.load('reloadable');

    await manager.reload('reloadable', { version: '2.0', hooks: { onInit: () => {} } });
    const p = manager.get('reloadable');
    assert.equal(p.version, '2.0');
    assert.equal(p.status, 'active');
  });

  it('should prevent unloading plugins with dependents', async () => {
    manager.register({ name: 'base', hooks: { onInit: () => {} } });
    await manager.load('base');
    manager.register({ name: 'child', dependencies: ['base'], hooks: { onInit: () => {} } });
    await manager.load('child');

    await assert.rejects(() => manager.unload('base'), /depend on it/);
  });

  it('should provide dashboard stats', async () => {
    manager.register({ name: 'a', hooks: { onInit: () => {} } });
    await manager.load('a');
    const dash = manager.getDashboard();
    assert.equal(dash.total, 1);
    assert.equal(dash.active, 1);
  });

  it('should enforce max plugins limit', () => {
    const small = new PluginManager({ maxPlugins: 1 });
    small.register({ name: 'one' });
    assert.throws(() => small.register({ name: 'two' }), /Max plugins/);
  });
});

// ── Rate Limiter Tests ──────────────────────────────────────────────────
import { RateLimiter, SlidingWindow, TokenBucket } from '../rate-limiting/rate-limiter.js';

describe('SlidingWindow', () => {
  it('should allow requests within limit', () => {
    const w = new SlidingWindow({ maxRequests: 3, windowMs: 60000 });
    assert.ok(w.allow());
    assert.ok(w.allow());
    assert.ok(w.allow());
    assert.ok(!w.allow());
    assert.equal(w.remaining(), 0);
  });

  it('should track allowed and denied stats', () => {
    const w = new SlidingWindow({ maxRequests: 1, windowMs: 60000 });
    w.allow();
    w.allow();
    const stats = w.getStats();
    assert.equal(stats.totalAllowed, 1);
    assert.equal(stats.totalDenied, 1);
  });

  it('should report retryAfter', () => {
    const w = new SlidingWindow({ maxRequests: 1, windowMs: 60000 });
    w.allow();
    assert.equal(w.remaining(), 0);
    assert.ok(w.retryAfter() > 0);
  });
});

describe('TokenBucket', () => {
  it('should consume tokens', () => {
    const b = new TokenBucket({ capacity: 5, refillRate: 0 });
    assert.ok(b.consume(3));
    assert.equal(b.available(), 2);
    assert.ok(!b.consume(5));
  });

  it('should track consumed count', () => {
    const b = new TokenBucket({ capacity: 10, refillRate: 0 });
    b.consume(3);
    b.consume(2);
    assert.equal(b.getStats().totalConsumed, 5);
  });
});

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter({ defaultMaxRequests: 5, defaultWindowMs: 60000 });
  });

  it('should allow requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('user-1');
      assert.ok(result.allowed);
    }
    const blocked = limiter.check('user-1');
    assert.ok(!blocked.allowed);
  });

  it('should limit per-key independently', () => {
    for (let i = 0; i < 5; i++) limiter.check('user-a');
    assert.ok(!limiter.check('user-a').allowed);
    // Different key should still work
    assert.ok(limiter.check('user-b').allowed);
  });

  it('should support custom per-key limits', () => {
    limiter.setLimit('vip', { maxRequests: 100 });
    for (let i = 0; i < 10; i++) {
      assert.ok(limiter.check('vip').allowed);
    }
  });

  it('should support token bucket strategy', () => {
    const tb = new RateLimiter({ strategy: 'token-bucket', defaultMaxRequests: 3 });
    assert.ok(tb.check('key1').allowed);
    assert.ok(tb.check('key1').allowed);
    assert.ok(tb.check('key1').allowed);
    assert.ok(!tb.check('key1').allowed);
  });

  it('should provide dashboard stats', () => {
    limiter.check('a');
    limiter.check('b');
    const dash = limiter.getDashboard();
    assert.equal(dash.totalKeys, 2);
    assert.equal(dash.stats.totalChecks, 2);
  });

  it('should reset key limits', () => {
    for (let i = 0; i < 5; i++) limiter.check('reset-me');
    assert.ok(!limiter.check('reset-me').allowed);
    limiter.reset('reset-me');
    assert.ok(limiter.check('reset-me').allowed);
  });

  it('should support global limits', () => {
    const global = new RateLimiter({ globalLimit: { maxRequests: 2 } });
    assert.ok(global.check('any-a').allowed);
    assert.ok(global.check('any-b').allowed);
    assert.ok(!global.check('any-c').allowed);
  });

  it('should emit events on deny', () => {
    let denied = false;
    limiter.on('rate-limit:denied', () => {
      denied = true;
    });
    for (let i = 0; i < 6; i++) limiter.check('trigger');
    assert.ok(denied);
  });

  it('should include retryAfterMs on deny', () => {
    for (let i = 0; i < 5; i++) limiter.check('retry-test');
    const result = limiter.check('retry-test');
    assert.ok(!result.allowed);
    assert.ok(result.retryAfterMs > 0);
  });
});
