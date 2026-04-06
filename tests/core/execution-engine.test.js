// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ExecutionEngine, ExecutionTask } from '../../src/core/orchestration/execution-engine.js';

// Mocks
class MockAIRouter {
  async routeRequest() { return { text: 'Mock AI Output' }; }
}
class MockRegistry {
  async getAgent() { return { execute: async () => 'Agent output' }; }
}

describe('ExecutionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ExecutionEngine({
      enableTracing: false,
      aiRouter: new MockAIRouter(),
      agentRegistry: new MockRegistry(),
      enablePerformanceMetrics: false
    });
    // Mock executeStep to avoid complex dependencies in basic execute tests
    engine.executeStep = async (step) => `Result for ${step.type}`;
  });

  it('should execute a task with multiple steps', async () => {
    const task = new ExecutionTask('t1', 'input', 'orchestrator', [
      { type: 'generate', id: 's1' },
      { type: 'tool', id: 's2' }
    ]);

    const result = await engine.execute(task);
    
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.results['s1'], 'Result for generate');
    assert.strictEqual(result.results['s2'], 'Result for tool');
    assert.strictEqual(task.status, 'completed');
  });

  it('should handle step execution failure', async () => {
    engine.executeStep = async (step) => {
      if (step.type === 'fail') throw new Error('Step failed');
      return 'ok';
    };

    const task = new ExecutionTask('t1', 'in', 'agent', [
      { type: 'ok', id: 's1' },
      { type: 'fail', id: 's2' }
    ]);

    await assert.rejects(
      () => engine.execute(task),
      { message: 'Step failed' }
    );
    assert.strictEqual(task.status, 'failed');
    assert.strictEqual(task.errors.length, 1);
  });

  it('should yield progress updates in executeStream', async () => {
    const task = new ExecutionTask('t1', 'in', 'agent', [
      { type: 'generate', id: 's1' }
    ]);

    const updates = [];
    for await (const update of engine.executeStream(task)) {
      updates.push(update);
    }

    assert.ok(updates.some(u => u.type === 'start'));
    assert.ok(updates.some(u => u.type === 'step_start'));
    assert.ok(updates.some(u => u.type === 'step_complete'));
    assert.ok(updates.some(u => u.type === 'complete'));
  });

  it('should execute generate step via AI router', async () => {
    // Restore real executeStep for this specific test
    delete engine.executeStep;
    
    const task = new ExecutionTask('t1', 'prompt', 'agent', []);
    const step = { type: 'generate', params: { prompt: 'hello' } };
    
    const result = await engine.executeGenerateStep(step, task);
    assert.strictEqual(result, 'Mock AI Output');
  });
});
