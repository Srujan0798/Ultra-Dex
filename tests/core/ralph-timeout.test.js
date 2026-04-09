// Copyright (c) 2026 Ultra-Dex
// RALPH Loop Timeout Test

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RALPHLoop } from '../../src/core/agents/ralph-loop.js';

describe('RALPH Loop Timeout', () => {
  let ralph;

  beforeEach(() => {
    ralph = new RALPHLoop({
      maxIterations: 100, // High iterations to ensure timeout hits first
      maxExecutionTimeMs: 100, // 100ms for fast testing
    });
  });

  it('should timeout when execution exceeds maxExecutionTimeMs', async () => {
    let timeoutEmitted = false;
    let timeoutEvent = null;

    // Override methods to make them slow (ensure timeout triggers)
    ralph.reason = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { reasoning: 'test' };
    };

    ralph.on('ralph.timeout', (event) => {
      timeoutEmitted = true;
      timeoutEvent = event;
    });

    try {
      await ralph.executeRALPHLoop('test problem');
      assert.fail('Should have thrown timeout error');
    } catch (error) {
      assert.ok(
        error.message.includes('RALPHLoop timeout after 100ms'),
        `Expected timeout error, got: ${error.message}`
      );
    }

    assert.ok(timeoutEmitted, 'ralph.timeout event should have been emitted');
    assert.strictEqual(timeoutEvent.maxExecutionTimeMs, 100);
  });

  it('should include maxExecutionTimeMs in timeout error message', async () => {
    const customTimeout = 150;
    ralph.config.maxExecutionTimeMs = customTimeout;

    ralph.reason = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { reasoning: 'test' };
    };

    try {
      await ralph.executeRALPHLoop('test problem');
      assert.fail('Should have thrown timeout error');
    } catch (error) {
      assert.ok(
        error.message.includes(`RALPHLoop timeout after ${customTimeout}ms`),
        `Error message should contain timeout duration: ${error.message}`
      );
    }
  });

  it('should complete normally when execution is within timeout', async () => {
    ralph.config.maxExecutionTimeMs = 5000; // 5 seconds

    const result = await ralph.executeRALPHLoop('quick problem');

    assert.ok(result.iterations > 0, 'Should have completed iterations');
    assert.ok(result.finalHypothesis, 'Should have a final hypothesis');
  });

  it('should emit ralph.timeout event before throwing', async () => {
    const events = [];

    ralph.reason = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { reasoning: 'test' };
    };

    ralph.on('ralph.timeout', (event) => {
      events.push({ type: 'timeout', data: event });
    });

    try {
      await ralph.executeRALPHLoop('test problem');
    } catch (error) {
      // Expected
    }

    assert.strictEqual(events.length, 1, 'Should have emitted exactly one timeout event');
    assert.strictEqual(events[0].data.maxExecutionTimeMs, 100);
  });

  it('should have default maxExecutionTimeMs of 300000 (5 minutes)', () => {
    const defaultRalph = new RALPHLoop();
    assert.strictEqual(
      defaultRalph.config.maxExecutionTimeMs,
      300000,
      'Default timeout should be 5 minutes (300000ms)'
    );
  });

  it('should allow custom maxExecutionTimeMs in constructor', () => {
    const customRalph = new RALPHLoop({ maxExecutionTimeMs: 60000 });
    assert.strictEqual(
      customRalph.config.maxExecutionTimeMs,
      60000,
      'Should accept custom timeout in constructor'
    );
  });
});
