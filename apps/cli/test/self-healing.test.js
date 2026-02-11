// Copyright (c) 2026 Ultra-Dex

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SelfHealingOrchestrator,
  CircuitBreaker,
  RetryStrategy,
  HealthMonitor,
} from '../lib/resilience/self-healing.js';

describe('Self-Healing System v6.0', () => {
  describe('CircuitBreaker', () => {
    it('should start in CLOSED state', () => {
      const cb = new CircuitBreaker();
      assert.strictEqual(cb.state, 'CLOSED');
    });

    it('should execute successful operations', async () => {
      const cb = new CircuitBreaker();
      const fn = async () => 'success';

      const result = await cb.execute(fn);
      assert.strictEqual(result, 'success');
    });

    it('should OPEN after threshold failures', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });
      const fn = async () => {
        throw new Error('fail');
      };

      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(fn);
        } catch (e) {}
      }

      assert.strictEqual(cb.state, 'OPEN');
    });

    it('should reject when OPEN', async () => {
      const cb = new CircuitBreaker();
      cb.state = 'OPEN';

      try {
        await cb.execute(async () => 'success');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('OPEN'));
      }
    });

    it('should HALF_OPEN after timeout', async () => {
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 10,
      });

      try {
        await cb.execute(async () => {
          throw new Error('fail');
        });
      } catch (e) {}

      await new Promise((r) => setTimeout(r, 20));

      assert.strictEqual(cb.state, 'HALF_OPEN');
    });

    it('should track metrics', async () => {
      const cb = new CircuitBreaker();

      await cb.execute(async () => 'success');

      const stats = cb.getStats();
      assert.strictEqual(stats.metrics.totalCalls, 1);
      assert.strictEqual(stats.metrics.successfulCalls, 1);
    });
  });

  describe('RetryStrategy', () => {
    it('should succeed on first try', async () => {
      const retry = new RetryStrategy();
      const fn = async () => 'success';

      const result = await retry.execute(fn);
      assert.strictEqual(result, 'success');
    });

    it('should retry on failure', async () => {
      const retry = new RetryStrategy({ maxRetries: 3, baseDelay: 10 });
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };

      const result = await retry.execute(fn);
      assert.strictEqual(result, 'success');
      assert.strictEqual(attempts, 3);
    });

    it('should fail after max retries', async () => {
      const retry = new RetryStrategy({ maxRetries: 2, baseDelay: 10 });

      try {
        await retry.execute(async () => {
          throw new Error('fail');
        });
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('fail'));
      }
    });

    it('should calculate exponential backoff', () => {
      const retry = new RetryStrategy({
        baseDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 1000,
      });

      assert.strictEqual(retry.calculateDelay(0), 100);
      assert.strictEqual(retry.calculateDelay(1), 200);
      assert.strictEqual(retry.calculateDelay(2), 400);
    });
  });

  describe('HealthMonitor', () => {
    it('should register health checks', () => {
      const monitor = new HealthMonitor();
      monitor.register('test', async () => {});

      assert.strictEqual(monitor.checks.size, 1);
    });

    it('should pass healthy checks', async () => {
      const monitor = new HealthMonitor();
      monitor.register('healthy', async () => ({ status: 'ok' }));

      await monitor.runAllChecks();
      const status = monitor.getStatus();

      assert.strictEqual(status.overall, 'healthy');
      assert.strictEqual(status.healthy, 1);
    });

    it('should detect unhealthy checks', async () => {
      const monitor = new HealthMonitor();
      monitor.register('failing', async () => {
        throw new Error('fail');
      });

      await monitor.runAllChecks();
      const status = monitor.getStatus();

      assert.strictEqual(status.unhealthy, 1);
    });

    it('should track check history', async () => {
      const monitor = new HealthMonitor();
      monitor.register('test', async () => {});

      await monitor.runAllChecks();
      const history = monitor.getHistory('test');

      assert.strictEqual(history.length, 1);
    });
  });

  describe('SelfHealingOrchestrator', () => {
    it('should initialize with default checks', async () => {
      const orchestrator = new SelfHealingOrchestrator();
      await orchestrator.initialize();

      assert.strictEqual(orchestrator.healthMonitor.checks.size, 2);
    });

    it('should create circuit breakers', () => {
      const orchestrator = new SelfHealingOrchestrator();
      const cb = orchestrator.getCircuitBreaker('test');

      assert.ok(cb);
      assert.strictEqual(cb.state, 'CLOSED');
    });

    it('should create retry strategies', () => {
      const orchestrator = new SelfHealingOrchestrator();
      const retry = orchestrator.getRetryStrategy('test');

      assert.ok(retry);
    });

    it('should execute with full resilience stack', async () => {
      const orchestrator = new SelfHealingOrchestrator();

      const fn = async () => 'success';
      const result = await orchestrator.execute({
        operation: fn,
        circuitBreakerName: 'test',
        retryStrategyName: 'test',
      });

      assert.strictEqual(result, 'success');
    });
  });
});
