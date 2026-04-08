// Copyright (c) 2026 Ultra-Dex
// Tests — Circuit Breaker + Provider Fallback + Queue Processor + Health Service

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Circuit Breaker Tests ───────────────────────────────────────────────
import { CircuitBreaker, CircuitBreakerRegistry } from '../reliability/circuit-breaker.js';

describe('CircuitBreaker', () => {
    let cb;
    beforeEach(() => {
        cb = new CircuitBreaker({ name: 'test', failureThreshold: 3, resetTimeoutMs: 100, timeoutMs: 5000 });
    });

    it('should start in CLOSED state', () => {
        assert.equal(cb.state, 'CLOSED');
    });

    it('should pass through successful calls', async () => {
        const result = await cb.execute(() => Promise.resolve('ok'));
        assert.equal(result, 'ok');
        assert.equal(cb.stats.success, 1);
    });

    it('should open after failure threshold', async () => {
        const fail = () => cb.execute(() => Promise.reject(new Error('fail'))).catch(() => { });
        await fail();
        await fail();
        assert.equal(cb.state, 'CLOSED');
        await fail();
        assert.equal(cb.state, 'OPEN');
    });

    it('should reject calls when OPEN', async () => {
        cb.forceState('OPEN');
        cb.openedAt = Date.now();
        await assert.rejects(() => cb.execute(() => Promise.resolve('x')), /OPEN/);
        assert.equal(cb.stats.rejected, 1);
    });

    it('should use fallback when OPEN', async () => {
        cb.forceState('OPEN');
        cb.openedAt = Date.now();
        const result = await cb.execute(() => Promise.resolve('x'), () => 'fallback');
        assert.equal(result, 'fallback');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
        cb.forceState('OPEN');
        cb.openedAt = Date.now() - 200; // Past the 100ms timeout
        const result = await cb.execute(() => Promise.resolve('recovered'));
        assert.equal(result, 'recovered');
        // Should now be CLOSED (success in half-open triggers close after successThreshold)
    });

    it('should emit state-change events', async () => {
        const events = [];
        cb.on('state-change', (e) => events.push(e));
        cb.forceState('OPEN');
        assert.equal(events.length, 1);
        assert.equal(events[0].to, 'OPEN');
    });

    it('should provide status', () => {
        const status = cb.getStatus();
        assert.equal(status.name, 'test');
        assert.equal(status.state, 'CLOSED');
    });
});

describe('CircuitBreakerRegistry', () => {
    it('should create and cache breakers', () => {
        const reg = new CircuitBreakerRegistry();
        const cb1 = reg.get('api-a');
        const cb2 = reg.get('api-a');
        assert.equal(cb1, cb2);
    });

    it('should provide dashboard', () => {
        const reg = new CircuitBreakerRegistry();
        reg.get('openai');
        reg.get('anthropic');
        const dash = reg.getDashboard();
        assert.equal(dash.total, 2);
        assert.equal(dash.closed, 2);
    });

    it('should reset all breakers', () => {
        const reg = new CircuitBreakerRegistry();
        const cb = reg.get('test');
        cb.forceState('OPEN');
        reg.resetAll();
        assert.equal(cb.state, 'CLOSED');
    });
});

// ── Provider Fallback Tests ─────────────────────────────────────────────
import { ProviderFallback } from '../reliability/provider-fallback.js';

describe('ProviderFallback', () => {
    let fallback;

    beforeEach(() => {
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

    it('should use highest priority provider', async () => {
        const result = await fallback.execute({ prompt: 'test' });
        assert.equal(result.provider, 'primary');
        assert.equal(result.result.text, 'from-primary');
    });

    it('should failover when primary fails', async () => {
        fallback.providers.get('primary').execute = async () => { throw new Error('timeout'); };
        // Need to trip the circuit breaker first - force it
        fallback.providers.get('primary').circuitBreaker.forceState('OPEN');
        fallback.providers.get('primary').circuitBreaker.openedAt = Date.now();

        const result = await fallback.execute({ prompt: 'test' });
        assert.equal(result.provider, 'secondary');
    });

    it('should track failover stats', async () => {
        // Make primary's circuit open
        fallback.providers.get('primary').circuitBreaker.forceState('OPEN');
        fallback.providers.get('primary').circuitBreaker.openedAt = Date.now();

        await fallback.execute({ prompt: 'test' });
        assert.ok(fallback.stats.failovers > 0);
    });

    it('should throw when all providers fail', async () => {
        fallback.providers.get('primary').circuitBreaker.forceState('OPEN');
        fallback.providers.get('primary').circuitBreaker.openedAt = Date.now();
        fallback.providers.get('secondary').circuitBreaker.forceState('OPEN');
        fallback.providers.get('secondary').circuitBreaker.openedAt = Date.now();

        await assert.rejects(() => fallback.execute({ prompt: 'test' }), /All providers failed/);
    });

    it('should support cost-optimized strategy', async () => {
        const costFallback = new ProviderFallback({ strategy: 'cost-optimized' });
        costFallback.addProvider('expensive', {
            priority: 1,
            costPer1kTokens: 0.10,
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

    it('should run health checks', async () => {
        const health = await fallback.healthCheck();
        assert.ok('primary' in health);
        assert.ok('secondary' in health);
    });

    it('should provide dashboard', () => {
        const dash = fallback.getDashboard();
        assert.equal(dash.totalProviders, 2);
        assert.equal(dash.strategy, 'priority');
    });

    it('should disable/enable providers', async () => {
        fallback.setEnabled('primary', false);
        const result = await fallback.execute({ prompt: 'test' });
        assert.equal(result.provider, 'secondary');
    });
});

// ── Queue Processor Tests ───────────────────────────────────────────────
import { QueueProcessor, Job } from '../queue/queue-processor.js';

describe('Job', () => {
    it('should create with default values', () => {
        const job = new Job({ type: 'test', payload: { task: 'analyze' } });
        assert.equal(job.type, 'test');
        assert.equal(job.status, 'pending');
        assert.ok(job.isReady());
    });

    it('should respect delay', () => {
        const job = new Job({ type: 'delayed', payload: {}, delayMs: 60000 });
        assert.ok(!job.isReady());
    });
});

describe('QueueProcessor', () => {
    let processor;

    beforeEach(() => {
        processor = new QueueProcessor({ concurrency: 2, pollIntervalMs: 50 });
    });

    it('should register handlers', () => {
        processor.registerHandler('email', async (payload) => `sent to ${payload.to}`);
        assert.ok(processor.handlers.has('email'));
    });

    it('should enqueue and process jobs', async () => {
        let result = null;
        processor.registerHandler('process', async (payload) => {
            result = payload.data;
            return result;
        });

        processor.enqueue({ type: 'process', payload: { data: 'hello' } });
        processor.start();
        await new Promise(r => setTimeout(r, 200));
        await processor.stop();

        assert.equal(result, 'hello');
        assert.equal(processor.stats.processed, 1);
    });

    it('should respect priority ordering', async () => {
        const order = [];
        processor.registerHandler('ordered', async (payload) => {
            order.push(payload.label);
        });

        processor.enqueue({ type: 'ordered', payload: { label: 'low' }, priority: 10 });
        processor.enqueue({ type: 'ordered', payload: { label: 'high' }, priority: 1 });

        processor.start();
        await new Promise(r => setTimeout(r, 300));
        await processor.stop();

        assert.equal(order[0], 'high');
        assert.equal(order[1], 'low');
    });

    it('should retry failed jobs', async () => {
        let attempts = 0;
        processor.registerHandler('flaky', async () => {
            attempts++;
            if (attempts < 2) throw new Error('flaky');
            return 'ok';
        });

        processor.enqueue({ type: 'flaky', payload: {}, maxRetries: 3 });
        processor.retryDelayMs = 50;
        processor.start();
        await new Promise(r => setTimeout(r, 500));
        await processor.stop();

        assert.ok(attempts >= 2);
        assert.ok(processor.stats.retried > 0);
    });

    it('should enforce max queue size', () => {
        const small = new QueueProcessor({ maxQueueSize: 2 });
        small.registerHandler('limited', async () => { });
        small.enqueue({ type: 'limited', payload: {} });
        small.enqueue({ type: 'limited', payload: {} });
        assert.throws(() => small.enqueue({ type: 'limited', payload: {} }), /full/);
    });

    it('should provide dashboard', () => {
        processor.registerHandler('test', async () => { });
        processor.enqueue({ type: 'test', payload: {} });
        const dash = processor.getDashboard();
        assert.equal(dash.running, false);
        assert.ok('test' in dash.queues);
        assert.equal(dash.stats.enqueued, 1);
    });

    it('should find jobs by ID', () => {
        processor.registerHandler('find', async () => { });
        const job = processor.enqueue({ type: 'find', payload: { x: 1 } });
        const found = processor.getJob(job.id);
        assert.equal(found.id, job.id);
    });
});

// ── Health Service Tests ────────────────────────────────────────────────
import { HealthService, HealthCheck } from '../system/health-service.js';

describe('HealthCheck', () => {
    it('should run healthy checks', async () => {
        const hc = new HealthCheck({ name: 'db', check: async () => ({ connected: true }) });
        const result = await hc.run();
        assert.equal(result.status, 'healthy');
        assert.ok(result.latency >= 0);
    });

    it('should mark as degraded on first failure', async () => {
        const hc = new HealthCheck({ name: 'api', check: async () => { throw new Error('down'); } });
        const result = await hc.run();
        assert.equal(result.status, 'degraded');
        assert.equal(hc.consecutiveFailures, 1);
    });

    it('should mark as unhealthy after 3 consecutive failures', async () => {
        const hc = new HealthCheck({ name: 'api', check: async () => { throw new Error('down'); } });
        await hc.run();
        await hc.run();
        const result = await hc.run();
        assert.equal(result.status, 'unhealthy');
    });

    it('should timeout long-running checks', async () => {
        const hc = new HealthCheck({
            name: 'slow',
            check: () => new Promise(r => setTimeout(r, 10000)),
            timeoutMs: 50,
        });
        const result = await hc.run();
        assert.equal(result.status, 'degraded');
        assert.ok(result.error.includes('timeout'));
    });
});

describe('HealthService', () => {
    let service;

    beforeEach(() => {
        service = new HealthService({ appName: 'test-app', version: '1.0.0' });
    });

    it('should return liveness probe', () => {
        const live = service.liveness();
        assert.equal(live.status, 'ok');
        assert.equal(live.app, 'test-app');
        assert.ok(live.uptime >= 0);
    });

    it('should check readiness with all checks healthy', async () => {
        service.addCheck({ name: 'db', check: async () => true, critical: true });
        service.addCheck({ name: 'cache', check: async () => true });
        const ready = await service.readiness();
        assert.equal(ready.status, 'ready');
    });

    it('should report not_ready when critical check fails', async () => {
        service.addCheck({ name: 'db', check: async () => { throw new Error('down'); }, critical: true });
        // Run check multiple times to get unhealthy
        const check = service.checks.get('db');
        await check.run();
        await check.run();
        await check.run();
        const ready = await service.readiness();
        assert.equal(ready.status, 'not_ready');
    });

    it('should report degraded when non-critical check fails', async () => {
        service.addCheck({ name: 'db', check: async () => true, critical: true });
        service.addCheck({ name: 'monitoring', check: async () => { throw new Error('down'); } });
        // Make monitoring unhealthy
        const mon = service.checks.get('monitoring');
        await mon.run();
        await mon.run();
        await mon.run();
        const ready = await service.readiness();
        assert.equal(ready.status, 'degraded');
    });

    it('should check all health probes', async () => {
        service.addCheck({ name: 'db', check: async () => ({ version: '5.7' }) });
        service.addCheck({ name: 'redis', check: async () => ({ status: 'connected' }) });
        const results = await service.checkAll();
        assert.ok('db' in results);
        assert.ok('redis' in results);
        assert.equal(results.db.status, 'healthy');
    });

    it('should provide dashboard', () => {
        service.addCheck({ name: 'db', check: async () => true });
        const dash = service.getDashboard();
        assert.equal(dash.app, 'test-app');
        assert.equal(dash.totalChecks, 1);
    });

    it('should provide Express middleware', () => {
        const mw = service.middleware();
        assert.ok(typeof mw.liveness === 'function');
        assert.ok(typeof mw.readiness === 'function');
        assert.ok(typeof mw.deep === 'function');
        assert.ok(typeof mw.full === 'function');
    });

    it('should run deep readiness checks', async () => {
        service.addReadinessCheck({ name: 'di-resolved', check: async () => true, critical: true });
        service.addReadinessCheck({ name: 'memory-initialized', check: async () => true, critical: true });
        service.addDeepCheck({ name: 'redis-connected', check: async () => true, critical: true });
        service.addDeepCheck({ name: 'audit-db-writable', check: async () => true, critical: true });
        service.addDeepCheck({ name: 'provider-reachable', check: async () => true, critical: true });
        const deep = await service.deep();
        assert.equal(deep.status, 'ready');
        assert.ok('redis-connected' in deep.deepChecks);
    });
});
