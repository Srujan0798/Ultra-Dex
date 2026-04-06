import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import TokenOptimizer from '../../src/core/performance/token-optimizer.js';
import performanceCache from '../../src/core/performance/cache.js';
import { AgentOrchestrator } from './orchestrator-minimal.js';

class MockMemory {
  async init() {
    return true;
  }

  async search() {
    return [];
  }

  async add() {
    return true;
  }
}

class MockAI {
  async call() {
    return { text: 'Tracked response' };
  }
}

describe('Performance integration', () => {
  let tokenOptimizer;

  beforeEach(async () => {
    tokenOptimizer = new TokenOptimizer();
    await performanceCache.clear();
  });

  it('compresses oversized context while preserving recent messages', () => {
    const messages = [
      { role: 'system', content: 'You are a performance assistant.' },
      ...Array.from({ length: 6 }, (_, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${index} ${'x'.repeat(180)}`,
      })),
    ];

    const compressed = tokenOptimizer.compressContext(messages, {
      maxTokens: 100,
      preserveRecent: 2,
      compressionLevel: 'medium',
    });

    assert.ok(compressed.length < messages.length);
    assert.strictEqual(compressed[0].role, 'system');
    assert.match(compressed[0].content, /\[Previous \d+ messages compressed\]/);
    assert.deepStrictEqual(compressed.slice(-2), messages.slice(-2));
  });

  it('returns cache miss before set and hit after set', async () => {
    const miss = await performanceCache.get('perf:missing');
    assert.strictEqual(miss, null);

    await performanceCache.set('perf:key', { ok: true, source: 'cache' }, 300);
    const hit = await performanceCache.get('perf:key');

    assert.deepStrictEqual(hit, { ok: true, source: 'cache' });
  });

  it('emits performance tracking events around task execution', async () => {
    const tracker = {
      startCalls: 0,
      endCalls: [],
      startTimer() {
        this.startCalls += 1;
        return 10;
      },
      endTimer(start, info) {
        this.endCalls.push({ start, info });
        return { durationMs: 42 };
      },
    };

    const orchestrator = new AgentOrchestrator({
      ai: new MockAI(),
      performanceTracker: tracker,
    });
    orchestrator.memory = new MockMemory();

    const performanceStarts = [];
    const performanceEnds = [];
    orchestrator.on('task:performance:start', (event) => performanceStarts.push(event));
    orchestrator.on('task:performance:end', (event) => performanceEnds.push(event));

    const result = await orchestrator.executeTask('Optimize execution path', {
      agentId: 'perf-agent',
      taskType: 'analysis',
    });

    assert.strictEqual(result.status, 'COMPLETE');
    assert.strictEqual(result.output, 'Tracked response');
    assert.strictEqual(tracker.startCalls, 1);
    assert.strictEqual(tracker.endCalls.length, 1);
    assert.strictEqual(tracker.endCalls[0].start, 10);
    assert.strictEqual(tracker.endCalls[0].info.endpoint, 'executeTask');
    assert.strictEqual(tracker.endCalls[0].info.method, 'TASK');
    assert.strictEqual(tracker.endCalls[0].info.statusCode, 200);
    assert.strictEqual(tracker.endCalls[0].info.agentId, 'perf-agent');
    assert.strictEqual(tracker.endCalls[0].info.taskType, 'analysis');

    assert.strictEqual(performanceStarts.length, 1);
    assert.strictEqual(performanceEnds.length, 1);
    assert.strictEqual(performanceStarts[0].agentId, 'perf-agent');
    assert.strictEqual(performanceStarts[0].taskType, 'analysis');
    assert.strictEqual(performanceEnds[0].durationMs, 42);
    assert.strictEqual(performanceEnds[0].statusCode, 200);
    assert.strictEqual(performanceEnds[0].success, true);
    assert.strictEqual(performanceEnds[0].error, null);
    assert.ok(orchestrator.metrics.lastTaskDurationMs >= 0);
  });
});
