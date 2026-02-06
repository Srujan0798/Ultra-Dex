/**
 * Unit tests for performance profiler
 * Tests: Timer functions, statistics calculation, formatting
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  startTimer,
  endTimer,
  timeAsync,
  timeSync,
  getStatistics,
  showReport,
  clearMetrics,
  profileCommand,
} from '../lib/utils/profiler.js';

describe('Performance Profiler', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('Timer Functions', () => {
    test('startTimer stores start time', () => {
      startTimer('test-op');
      // Timer should be active
      const stats = getStatistics();
      assert.strictEqual(Object.keys(stats).length, 0, 'Should not have stats yet');
    });

    test('endTimer returns duration', async () => {
      startTimer('test-op');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = endTimer('test-op');

      assert.ok(duration > 0, 'Duration should be positive');
      assert.ok(duration >= 10, 'Duration should be at least 10ms');
    });

    test('endTimer without startTimer returns 0 and warns', () => {
      const duration = endTimer('non-existent');
      assert.strictEqual(duration, 0);
    });

    test('multiple timers can run simultaneously', async () => {
      startTimer('op1');
      startTimer('op2');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const duration1 = endTimer('op1');
      const duration2 = endTimer('op2');

      assert.ok(duration1 > 0);
      assert.ok(duration2 > 0);
    });

    test('timer cannot be ended twice', async () => {
      startTimer('test-op');
      await new Promise((resolve) => setTimeout(resolve, 5));

      const duration1 = endTimer('test-op');
      const duration2 = endTimer('test-op');

      assert.ok(duration1 > 0);
      assert.strictEqual(duration2, 0, 'Second end should return 0');
    });
  });

  describe('timeAsync', () => {
    test('times async function', async () => {
      const result = await timeAsync('async-op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      assert.strictEqual(result, 'done');

      const stats = getStatistics();
      assert.ok(stats['async-op'], 'Should have stats for async-op');
      assert.ok(stats['async-op'].average >= 10, 'Average should be at least 10ms');
    });

    test('preserves error', async () => {
      await assert.rejects(async () => {
        await timeAsync('error-op', async () => {
          throw new Error('Test error');
        });
      }, /Test error/);
    });
  });

  describe('timeSync', () => {
    test('times sync function', () => {
      const result = timeSync('sync-op', () => {
        // Busy wait for ~5ms
        const start = Date.now();
        while (Date.now() - start < 5) {}
        return 42;
      });

      assert.strictEqual(result, 42);

      const stats = getStatistics();
      assert.ok(stats['sync-op'], 'Should have stats for sync-op');
    });

    test('preserves error', () => {
      assert.throws(() => {
        timeSync('error-op', () => {
          throw new Error('Test error');
        });
      }, /Test error/);
    });
  });

  describe('Statistics', () => {
    test('calculates statistics correctly', async () => {
      // Record multiple timings
      for (let i = 0; i < 5; i++) {
        startTimer('stats-test');
        await new Promise((resolve) => setTimeout(resolve, 10 + i * 5));
        endTimer('stats-test');
      }

      const stats = getStatistics();
      const s = stats['stats-test'];

      assert.ok(s, 'Should have stats');
      assert.strictEqual(s.count, 5);
      assert.ok(s.total > 0);
      assert.ok(s.average > 0);
      assert.ok(s.min > 0);
      assert.ok(s.max > s.min);
      assert.ok(s.median > 0);
      assert.ok(s.p95 > 0);
    });

    test('returns empty object when no metrics', () => {
      const stats = getStatistics();
      assert.deepStrictEqual(stats, {});
    });

    test('handles single timing', () => {
      timeSync('single', () => {});

      const stats = getStatistics();
      const s = stats['single'];

      assert.strictEqual(s.count, 1);
      assert.strictEqual(s.min, s.max);
      assert.strictEqual(s.min, s.average);
    });
  });

  describe('clearMetrics', () => {
    test('clears all metrics', () => {
      timeSync('op1', () => {});
      timeSync('op2', () => {});

      assert.strictEqual(Object.keys(getStatistics()).length, 2);

      clearMetrics();

      assert.strictEqual(Object.keys(getStatistics()).length, 0);
    });

    test('clears active timers', () => {
      startTimer('active');
      clearMetrics();

      // Should be able to start new timer with same name
      startTimer('active');
      const duration = endTimer('active');
      assert.ok(duration >= 0);
    });
  });

  describe('profileCommand', () => {
    test('profiles command execution', async () => {
      let executed = false;

      await profileCommand('test-command', async () => {
        timeSync('sub-op', () => {
          const start = Date.now();
          while (Date.now() - start < 5) {}
        });
        executed = true;
      });

      assert.strictEqual(executed, true);

      const stats = getStatistics();
      assert.ok(stats['sub-op'], 'Should have sub-operation stats');
    });

    test('handles command errors', async () => {
      let errorThrown = false;

      try {
        await profileCommand('error-command', async () => {
          throw new Error('Command failed');
        });
      } catch (e) {
        errorThrown = true;
        assert.strictEqual(e.message, 'Command failed');
      }

      assert.strictEqual(errorThrown, true);
    });
  });
});
