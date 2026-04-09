import { describe, it } from 'node:test';
import assert from 'node:assert';
import { QueueProcessor, Job } from '../../src/core/infrastructure/queue-processor.js';
import { AgentOrchestrator } from './orchestrator-minimal.js';

describe('QueueProcessor', () => {
  it('creates jobs with the expected defaults', () => {
    const job = new Job({ type: 'task', payload: { id: 1 } });
    assert.equal(job.status, 'pending');
    assert.equal(job.type, 'task');
    assert.ok(job.isReady());
  });

  it('dequeues by priority and processes jobs through handlers', async () => {
    const processor = new QueueProcessor({ concurrency: 1, pollIntervalMs: 10 });
    const processed = [];

    processor.registerHandler('task', async (payload) => {
      processed.push(payload.label);
      return payload.label;
    });

    processor.enqueue({ label: 'low' }, 10);
    processor.enqueue({ label: 'high' }, 1);

    const first = processor.dequeue();
    assert.equal(first.payload.label, 'high');

    processor.enqueue(first);
    processor.start();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await processor.stop();

    assert.deepStrictEqual(processed, ['high', 'low']);
    assert.equal(processor.getStats().processed, 2);
  });

  it('queues orchestration tasks when all agents are busy', async () => {
    const queueProcessor = new QueueProcessor({ concurrency: 1, pollIntervalMs: 10 });
    const orchestrator = new AgentOrchestrator({
      ai: {
        async call(_model, messages) {
          const taskMessage = messages[messages.length - 1].content;
          if (taskMessage.includes('Task: first task')) {
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
          return {
            text: taskMessage.includes('Task: first task') ? 'first result' : 'second result',
          };
        },
      },
      maxConcurrentAgents: 1,
      queueProcessor,
    });

    orchestrator.memory = {
      async init() {
        return true;
      },
      async search() {
        return [];
      },
      async add() {
        return true;
      },
    };
    orchestrator.governance = {
      async gate() {
        return { allowed: true };
      },
      audit: {
        async record() {
          return true;
        },
      },
    };
    orchestrator.registry.getAgentPrompt = async () => 'Test prompt';
    orchestrator.setQueueProcessor(queueProcessor);

    const queuedEvents = [];
    orchestrator.on('task:queued', (event) => queuedEvents.push(event));

    const firstTask = orchestrator.executeTask('first task', {
      agentId: 'worker-1',
      priority: 5,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondTask = orchestrator.executeTask('second task', {
      agentId: 'worker-1',
      priority: 1,
    });

    const [firstResult, secondResult] = await Promise.all([firstTask, secondTask]);
    const stats = queueProcessor.getStats();

    assert.equal(firstResult.status, 'COMPLETE');
    assert.equal(secondResult.status, 'COMPLETE');
    assert.equal(queuedEvents.length, 1);
    assert.equal(queuedEvents[0].task, 'second task');
    assert.ok(stats.enqueued >= 1);

    await queueProcessor.stop();
  });
});
