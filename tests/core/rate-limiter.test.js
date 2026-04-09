import 'reflect-metadata';
// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Unit tests for rate limiter in ExecutionController
 * @module tests/core/rate-limiter
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { ExecutionController } from '../../apps/cli/lib/autonomous/execution-controller.js';
import { performance } from 'perf_hooks';
import { AIMetaLayer } from '../../src/core/ai/ai-meta-layer.js';
import { RateLimiter as InfrastructureRateLimiter } from '../../src/core/infrastructure/rate-limiter.js';

// Mock time for consistent testing
let mockTime = 0;
const originalNow = Date.now;
const originalPerformanceNow = performance.now;
let originalSetTimeout = null;

describe('Rate Limiter Tests', () => {
  let controller;

  beforeEach(() => {
    // Reset mock time
    mockTime = 0;

    // Mock Date.now()
    Date.now = () => mockTime;

    // Mock performance.now()
    performance.now = () => mockTime;

    // Create controller with low rate limit for testing
    controller = new ExecutionController({
      maxRequestsPerMinute: 60, // 1 per second
      burstLimit: 3,
    });

    // Mock setTimeout to advance mockTime
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => {
      mockTime += delay;
      return originalSetTimeout(fn, 0); // Execute immediately for tests
    };
  });

  afterEach(() => {
    // Restore original functions
    Date.now = originalNow;
    performance.now = originalPerformanceNow;

    // Restore original setTimeout
    if (originalSetTimeout) {
      global.setTimeout = originalSetTimeout;
    }
  });

  it('Default maxRequestsPerMinute is 60', () => {
    const defaultController = new ExecutionController();
    assert.equal(defaultController.options.maxRequestsPerMinute, 60);
  });

  it('Tasks execute normally under limit', async () => {
    // Mock task execution
    controller._executeTask = async (task) => {
      return {
        taskId: task.id,
        success: true,
        output: `Result for ${task.description}`,
        duration: 10,
      };
    };

    // Execute 3 tasks (within burst limit of 3)
    const tasks = [
      { id: 'task1', description: 'Task 1' },
      { id: 'task2', description: 'Task 2' },
      { id: 'task3', description: 'Task 3' },
    ];

    const startTime = Date.now();
    const results = await Promise.all(tasks.map((task) => controller._executeTask(task)));
    const endTime = Date.now();

    // All should execute immediately (no waiting)
    assert.equal(endTime - startTime, 0);
    assert.equal(results.length, 3);
    results.forEach((result) => {
      assert.equal(result.success, true);
    });
  });

  it('Tasks get throttled when exceeding limit', async () => {
    // Mock task execution but preserve rate limiting
    const originalExecuteTask = controller._executeTask.bind(controller);
    controller._executeTask = async (task) => {
      await controller._checkRateLimit();
      return {
        taskId: task.id,
        success: true,
        output: `Result for ${task.description}`,
        duration: 10,
      };
    };

    // Track rate limit events
    let waitingEvents = 0;
    controller.on('rateLimit:waiting', () => {
      waitingEvents++;
    });

    // Execute 5 tasks (exceeds burst limit of 3)
    const tasks = [
      { id: 'task1', description: 'Task 1' },
      { id: 'task2', description: 'Task 2' },
      { id: 'task3', description: 'Task 3' },
      { id: 'task4', description: 'Task 4' },
      { id: 'task5', description: 'Task 5' },
    ];

    const startTime = Date.now();
    const results = await Promise.all(tasks.map((task) => controller._executeTask(task)));
    const endTime = Date.now();
    const elapsed = endTime - startTime;

    // Should have waiting events due to throttling
    assert.ok(waitingEvents > 0, `Should have rate limit waiting events, got ${waitingEvents}`);

    // Should have taken some time due to waiting
    // With 60 req/min = 1 req/sec, burst of 3, tasks 4&5 should wait concurrently
    assert.ok(elapsed >= 900, `Should have experienced throttling delay, got ${elapsed}ms`);

    assert.equal(results.length, 5);
    results.forEach((result) => {
      assert.equal(result.success, true);
    });

    // Restore original method
    controller._executeTask = originalExecuteTask;
  });

  it('Burst limit allows short bursts', async () => {
    // Mock task execution
    controller._executeTask = async (task) => {
      return {
        taskId: task.id,
        success: true,
        output: `Result for ${task.description}`,
        duration: 10,
      };
    };

    // Track rate limit events
    let waitingEvents = 0;
    controller.on('rateLimit:waiting', () => {
      waitingEvents++;
    });

    // Execute exactly burst limit tasks (3)
    const tasks = [
      { id: 'task1', description: 'Task 1' },
      { id: 'task2', description: 'Task 2' },
      { id: 'task3', description: 'Task 3' },
    ];

    const startTime = Date.now();
    const results = await Promise.all(tasks.map((task) => controller._executeTask(task)));
    const endTime = Date.now();

    // Should execute immediately (within burst limit)
    assert.equal(waitingEvents, 0, 'Should have no waiting events within burst limit');
    assert.equal(endTime - startTime, 0, 'Should execute immediately within burst limit');

    assert.equal(results.length, 3);
    results.forEach((result) => {
      assert.equal(result.success, true);
    });
  });

  it('rateLimit:waiting event emitted when throttled', async () => {
    // Mock task execution but preserve rate limiting
    const originalExecuteTask = controller._executeTask.bind(controller);
    controller._executeTask = async (task) => {
      await controller._checkRateLimit();
      return {
        taskId: task.id,
        success: true,
        output: `Result for ${task.description}`,
        duration: 10,
      };
    };

    // Track rate limit events
    let waitingEvents = 0;
    let lastWaitingEvent = null;
    controller.on('rateLimit:waiting', (data) => {
      waitingEvents++;
      lastWaitingEvent = data;
    });

    // Execute 4 tasks (1 over burst limit of 3)
    const tasks = [
      { id: 'task1', description: 'Task 1' },
      { id: 'task2', description: 'Task 2' },
      { id: 'task3', description: 'Task 3' },
      { id: 'task4', description: 'Task 4' },
    ];

    await Promise.all(tasks.map((task) => controller._executeTask(task)));

    assert.equal(waitingEvents, 1, 'Should emit exactly one rateLimit:waiting event');
    assert.ok(lastWaitingEvent, 'Should have waiting event data');
    assert.ok(lastWaitingEvent.waitTime > 0, 'Waiting event should have wait time');

    // Restore original method
    controller._executeTask = originalExecuteTask;
  });

  it('Tokens refill over time', async () => {
    // Mock task execution but preserve rate limiting
    const originalExecuteTask = controller._executeTask.bind(controller);
    controller._executeTask = async (task) => {
      await controller._checkRateLimit();
      return {
        taskId: task.id,
        success: true,
        output: `Result for ${task.description}`,
        duration: 10,
      };
    };

    // Track rate limit events
    let waitingEvents = 0;
    controller.on('rateLimit:waiting', () => {
      waitingEvents++;
    });

    // Use up all burst tokens (3)
    const burstTasks = [
      { id: 'burst1', description: 'Burst Task 1' },
      { id: 'burst2', description: 'Burst Task 2' },
      { id: 'burst3', description: 'Burst Task 3' },
    ];

    await Promise.all(burstTasks.map((task) => controller._executeTask(task)));

    // Next task should wait (no tokens)
    const waitingTask = { id: 'wait1', description: 'Waiting Task' };
    let waitStarted = false;
    const waitPromise = controller._executeTask(waitingTask).then(() => {
      waitStarted = true;
    });

    // Wait a bit to let time pass
    mockTime += 1500; // 1.5 seconds

    // Now the task should be able to proceed (tokens refilled)
    await waitPromise;

    // Should have had exactly one waiting event
    assert.equal(waitingEvents, 1, 'Should have had one waiting event');
    assert.ok(waitStarted, 'Task should have eventually started');

    // Restore original method
    controller._executeTask = originalExecuteTask;
  });
});

describe('Infrastructure RateLimiter', () => {
  it('acquires and releases provider permits', async () => {
    const limiter = new InfrastructureRateLimiter(null, {
      defaultTokensPerSecond: 5,
      defaultCapacity: 2,
      defaultBurstMaxRequests: 10,
    });

    const lease = await limiter.acquire('openai', { wait: false });
    const during = limiter.getStats('openai');
    assert.equal(during.inFlight, 1);

    limiter.release(lease);
    const after = limiter.getStats('openai');
    assert.equal(after.inFlight, 0);
    assert.ok(after.tokenBucket.totalConsumed >= 1);
  });

  it('enforces provider-specific burst and token limits', async () => {
    const limiter = new InfrastructureRateLimiter({
      defaultAcquireTimeoutMs: 5,
    });
    limiter.setLimit('anthropic', {
      tokensPerSecond: 0.1,
      capacity: 1,
      burstMaxRequests: 1,
      burstWindowMs: 60000,
    });

    const lease = await limiter.acquire('anthropic', { wait: false });
    limiter.release(lease);

    await assert.rejects(
      () => limiter.acquire('anthropic', { wait: false }),
      /Rate limit exceeded/
    );
  });

  it('checks rate limit before AIMetaLayer provider calls', async () => {
    const limiter = new InfrastructureRateLimiter({
      defaultAcquireTimeoutMs: 5,
    });
    limiter.setLimit('mock', {
      tokensPerSecond: 0.1,
      capacity: 1,
      burstMaxRequests: 1,
      burstWindowMs: 60000,
    });

    const ai = new AIMetaLayer({
      mockMode: true,
      enableCaching: false,
      enableFallback: false,
      rateLimiter: limiter,
    });

    await ai.call(null, [{ role: 'user', content: 'first call' }], {
      rateLimitWait: false,
    });

    await assert.rejects(
      () =>
        ai.call(null, [{ role: 'user', content: 'second call' }], {
          rateLimitWait: false,
        }),
      /Rate limit exceeded/
    );
  });
});
