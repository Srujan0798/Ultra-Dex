import "reflect-metadata";
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { RALPHLoop } from '../../src/core/agents/ralph-loop.js';

describe('Predictive memory integration', () => {
  it('uses pre-fetched context before falling back to synchronous memory search', async () => {
    let searchCalls = 0;
    let recordedUsage = [];
    const memory = {
      async init() {},
      async search() {
        searchCalls++;
        return [{ id: 'fallback', content: 'sync lookup' }];
      },
      async add() {
        return true;
      },
    };

    const predictiveEngine = {
      spawnBackgroundPrefetch() {
        return Promise.resolve({
          taskId: 'prefetch-task',
          items: [{ id: 'prefetch-1', content: 'cached context' }],
          metrics: { durationMs: 4 },
        });
      },
      async awaitPrefetch() {
        return {
          taskId: 'prefetch-task',
          items: [{ id: 'prefetch-1', content: 'cached context' }],
          metrics: { durationMs: 4 },
        };
      },
      recordUsage(taskId, useful) {
        recordedUsage.push({ taskId, useful });
      },
      getStats() {
        return { prefetchHitRate: 1 };
      },
    };

    const orchestrator = new AgentOrchestrator({
      memory,
      predictiveEngine,
      ai: {
        async call(_model, messages) {
          return {
            text: messages[1].content,
            usage: { totalTokens: 5 },
          };
        },
      },
      registry: {
        findAgentsByCapabilities() {
          return [];
        },
        async getAgentPrompt() {
          return 'You are a backend agent.';
        },
        async initialize() {},
      },
      governance: {
        async gate() {
          return { allowed: true };
        },
        audit: {
          async record() {},
        },
      },
      telemetry: {
        async trackMetric() {},
      },
      selfHealing: {
        async initialize() {},
      },
      mcpServer: { toolsMap: new Map() },
    });

    const result = await orchestrator.runTaskExecution('Optimize database queries', {
      agentId: 'backend',
      taskType: 'coding',
    });

    assert.strictEqual(searchCalls, 0);
    assert.strictEqual(result.status, 'COMPLETE');
    assert.ok(result.output.includes('cached context'));
    assert.strictEqual(recordedUsage[0].useful, true);
    assert.strictEqual(orchestrator.getMetrics().prefetchHitRate, 1);
  });

  it('pre-hydrates RALPH context before the first iteration', async () => {
    const loop = new RALPHLoop({
      maxIterations: 1,
      initialContext: [{ id: 'memory-1', content: 'Prior context' }],
    });
    let hydrationEvent = null;
    loop.on('ralph.context-prehydrated', (payload) => {
      hydrationEvent = payload;
    });

    await loop.executeRALPHLoop('Solve deployment regression');

    assert.ok(hydrationEvent);
    assert.strictEqual(hydrationEvent.count, 1);
  });
});
