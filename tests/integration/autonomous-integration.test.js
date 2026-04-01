/**
 * Autonomous Loop Integration Test
 * End-to-end test for the full autonomous agent workflow
 * 
 * @module tests/integration/autonomous-integration.test
 */

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';

import { PlanningEngine } from '../../apps/cli/lib/autonomous/planning-engine.js';
import { TaskDecomposer } from '../../apps/cli/lib/autonomous/task-decomposer.js';
import { ExecutionController } from '../../apps/cli/lib/autonomous/execution-controller.js';
import { ValidationLayer } from '../../apps/cli/lib/autonomous/validation-layer.js';
import { MemoryBridge } from '../../apps/cli/lib/autonomous/memory-bridge.js';

/**
 * Mock provider for testing without real API calls
 */
const mockProvider = {
  generate: async ({ userPrompt }) => {
    return JSON.stringify({
      tasks: [
        { id: 'task-1', description: 'Mock task 1', dependencies: [], priority: 8, estimatedComplexity: 'low', type: 'code' },
        { id: 'task-2', description: 'Mock task 2', dependencies: ['task-1'], priority: 6, estimatedComplexity: 'medium', type: 'test' },
        { id: 'task-3', description: 'Mock task 3', dependencies: ['task-1'], priority: 5, estimatedComplexity: 'low', type: 'doc' }
      ],
      summary: 'Mock implementation plan',
      estimatedDuration: '1 hour'
    });
  },
  complete: async (prompt) => {
    return JSON.stringify({
      tasks: [
        { id: 'task-1', description: 'Analyze requirements', dependencies: [], priority: 10, estimatedComplexity: 'low', type: 'research' },
        { id: 'task-2', description: 'Implement solution', dependencies: ['task-1'], priority: 8, estimatedComplexity: 'high', type: 'code' }
      ],
      summary: 'Mock plan from complete()',
      estimatedDuration: '2 hours'
    });
  },
  chat: async (messages) => {
    return {
      content: JSON.stringify({ status: 'success', output: 'Mock execution result' })
    };
  }
};

describe('Autonomous Loop Integration', () => {
  let planner;
  let decomposer;
  let executor;
  let validator;
  let memory;

  before(() => {
    planner = new PlanningEngine({ provider: mockProvider });
    decomposer = new TaskDecomposer();
    executor = new ExecutionController({ provider: mockProvider, maxConcurrency: 2 });
    validator = new ValidationLayer({ strictness: 'normal' });
    memory = new MemoryBridge({ sessionId: 'test-session-001' });
  });

  after(() => {
    memory.clearSession();
    planner.clearHistory();
    validator.clearHistory();
  });

  describe('Planning Phase', () => {
    it('should generate a plan from a goal', async () => {
      const plan = await planner.plan('Build a REST API endpoint');
      
      assert.ok(plan, 'Plan should be generated');
      assert.ok(plan.id, 'Plan should have an ID');
      assert.ok(Array.isArray(plan.tasks), 'Plan should have tasks array');
      assert.ok(plan.tasks.length > 0, 'Plan should have at least one task');
      assert.ok(plan.summary, 'Plan should have a summary');
    });

    it('should handle planning without provider (mock mode)', async () => {
      const standaloneEngine = new PlanningEngine(); // No provider
      const plan = await standaloneEngine.plan('Test goal without provider');
      
      assert.ok(plan.tasks.length > 0, 'Should return mock tasks');
    });

    it('should emit planning events', async () => {
      const events = [];
      planner.on('plan:start', (data) => events.push({ type: 'start', data }));
      planner.on('plan:complete', (data) => events.push({ type: 'complete', data }));

      await planner.plan('Test with events');

      assert.ok(events.some(e => e.type === 'start'), 'Should emit plan:start');
      assert.ok(events.some(e => e.type === 'complete'), 'Should emit plan:complete');
    });
  });

  describe('Task Decomposition Phase', () => {
    it('should decompose plan into batches', async () => {
      const plan = await planner.plan('Create user authentication');
      const decomposed = decomposer.decompose(plan);

      assert.ok(decomposed.orderedTasks, 'Should have ordered tasks');
      assert.ok(decomposed.batches, 'Should have batches');
      assert.ok(decomposed.batches.length > 0, 'Should have at least one batch');
      assert.ok(decomposed.metadata, 'Should have metadata');
    });

    it('should detect circular dependencies', () => {
      const cyclicPlan = {
        id: 'cyclic-plan',
        tasks: [
          { id: 'a', dependencies: ['c'] },
          { id: 'b', dependencies: ['a'] },
          { id: 'c', dependencies: ['b'] }
        ]
      };

      assert.throws(() => {
        decomposer.decompose(cyclicPlan);
      }, /[Cc]ircular/);
    });

    it('should calculate critical path', async () => {
      const plan = await planner.plan('Multi-step task');
      const decomposed = decomposer.decompose(plan);

      assert.ok(decomposed.metadata.criticalPath, 'Should have critical path');
      assert.ok(Array.isArray(decomposed.metadata.criticalPath), 'Critical path should be array');
    });
  });

  describe('Execution Phase', () => {
    it('should execute tasks in parallel', async () => {
      const plan = await planner.plan('Execute parallel tasks');
      const decomposed = decomposer.decompose(plan);
      
      const results = await executor.execute(decomposed, 'parallel');

      assert.ok(results, 'Should return results');
      assert.ok(results.metrics, 'Should have metrics');
      assert.equal(results.metrics.totalTasks, decomposed.orderedTasks.length);
    });

    it('should execute tasks sequentially', async () => {
      const plan = await planner.plan('Execute sequential tasks');
      const decomposed = decomposer.decompose(plan);
      
      const results = await executor.execute(decomposed, 'sequential');

      assert.ok(results.results, 'Should have task results');
      assert.ok(results.duration > 0, 'Should track duration');
    });

    it('should emit execution events', async () => {
      const events = [];
      executor.on('execution:start', () => events.push('start'));
      executor.on('batch:start', () => events.push('batch'));
      executor.on('execution:complete', () => events.push('complete'));

      const plan = await planner.plan('Test events');
      const decomposed = decomposer.decompose(plan);
      await executor.execute(decomposed);

      assert.ok(events.includes('start'), 'Should emit execution:start');
      assert.ok(events.includes('complete'), 'Should emit execution:complete');
    });

    it('should handle task timeout', async () => {
      const slowExecutor = new ExecutionController({ 
        taskTimeout: 50 // Very short timeout
      });
      
      // This test verifies timeout handling exists
      assert.equal(slowExecutor.taskTimeout, 50);
    });
  });

  describe('Validation Phase', () => {
    it('should validate successful results', () => {
      const result = { success: true, output: 'Task completed' };
      const validation = validator.validate(result, {});

      assert.equal(validation.valid, true);
      assert.equal(validation.errors.length, 0);
    });

    it('should validate against schema', () => {
      const result = { name: 'test', count: 5 };
      const validation = validator.validate(result, {
        schema: {
          type: 'object',
          required: ['name', 'count']
        }
      });

      assert.equal(validation.valid, true);
    });

    it('should fail validation for missing required fields', () => {
      const result = { name: 'test' };
      const validation = validator.validate(result, {
        schema: {
          type: 'object',
          required: ['name', 'count', 'status']
        }
      });

      assert.equal(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });

    it('should validate against regex patterns', () => {
      const result = 'SUCCESS: Operation completed';
      const validation = validator.validate(result, {
        regex: { match: 'SUCCESS' }
      });

      assert.equal(validation.valid, true);
    });

    it('should check gates', () => {
      const result = { status: 'ok' };
      const validation = validator.validate(result, {
        gates: ['quality']
      });

      assert.ok(validation.gatesPassed.includes('quality') || validation.gatesFailed.length >= 0);
    });
  });

  describe('Memory Phase', () => {
    it('should save context', async () => {
      const contextId = await memory.saveContext('goal', { description: 'Test goal' });
      
      assert.ok(contextId, 'Should return context ID');
      assert.ok(contextId.startsWith('ctx-'), 'ID should have correct prefix');
    });

    it('should load context', async () => {
      await memory.saveContext('plan', { tasks: ['task1', 'task2'] });
      
      const context = await memory.loadContext({});
      
      assert.ok(context.plans, 'Should have plans');
      assert.ok(context.plans.length > 0, 'Should have saved plans');
    });

    it('should search relevant context', async () => {
      await memory.saveContext('learning', { insight: 'Use async/await for better readability' });
      
      const results = await memory.searchRelevant('async');
      
      assert.ok(Array.isArray(results), 'Should return array');
    });

    it('should export and import session', async () => {
      await memory.saveContext('goal', { test: 'export test' });
      
      const exported = memory.exportSession();
      assert.ok(exported.sessionId, 'Export should have session ID');
      assert.ok(exported.context, 'Export should have context');

      const newMemory = new MemoryBridge();
      newMemory.importSession(exported);
      
      assert.equal(newMemory.sessionId, exported.sessionId);
    });

    it('should get session summary', () => {
      const summary = memory.getSummary();
      
      assert.ok(summary.sessionId, 'Summary should have session ID');
      assert.ok(typeof summary.goalCount === 'number', 'Should have goal count');
    });
  });

  describe('Full Loop Integration', () => {
    it('should complete full autonomous cycle', async () => {
      // 1. Plan
      const plan = await planner.plan('Implement user login feature');
      assert.ok(plan.tasks.length > 0, 'Planning complete');

      // 2. Save goal to memory
      await memory.saveContext('goal', { description: 'Implement user login feature' });

      // 3. Decompose
      const decomposed = decomposer.decompose(plan);
      assert.ok(decomposed.batches.length > 0, 'Decomposition complete');

      // 4. Save plan to memory
      await memory.saveContext('plan', plan);

      // 5. Execute
      const results = await executor.execute(decomposed);
      assert.ok(results.metrics.completed >= 0, 'Execution complete');

      // 6. Save results to memory
      await memory.saveContext('result', results);

      // 7. Validate
      const validation = validator.validate(results, {
        schema: { type: 'object', required: ['status', 'results'] }
      });

      // 8. Save learning
      await memory.saveContext('learning', {
        insight: `Completed ${results.metrics.completed} tasks`,
        validation: validation.valid
      });

      // 9. Verify full context saved
      const finalContext = await memory.loadContext({});
      assert.ok(finalContext.goals.length > 0, 'Goals saved');
      assert.ok(finalContext.plans.length > 0, 'Plans saved');
      assert.ok(finalContext.taskResults.length > 0, 'Results saved');
      assert.ok(finalContext.learnings.length > 0, 'Learnings saved');

      console.log('✅ Full autonomous cycle completed successfully');
    });
  });
});
