/**
 * Autonomous Loop Unit Tests
 * Tests for individual autonomous components
 * 
 * @module tests/core/autonomous-loop.test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { PlanningEngine } from '../../apps/cli/lib/autonomous/planning-engine.js';
import { TaskDecomposer } from '../../apps/cli/lib/autonomous/task-decomposer.js';
import { ExecutionController } from '../../apps/cli/lib/autonomous/execution-controller.js';
import { ValidationLayer } from '../../apps/cli/lib/autonomous/validation-layer.js';
import { MemoryBridge } from '../../apps/cli/lib/autonomous/memory-bridge.js';
import { ApprovalGates, AUTONOMOUS_GATES } from '../../apps/cli/lib/autonomous/gates.js';

// ============================================================================
// PlanningEngine Tests
// ============================================================================

describe('PlanningEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PlanningEngine();
  });

  it('should initialize with default options', () => {
    assert.equal(engine.maxRetries, 3);
    assert.equal(engine.retryDelay, 1000);
    assert.deepEqual(engine.planHistory, []);
  });

  it('should generate mock plan without provider', async () => {
    const plan = await engine.plan('Test goal');
    
    assert.ok(plan.id);
    assert.ok(plan.tasks.length > 0);
    assert.equal(plan.goal, 'Test goal');
  });

  it('should build planning prompt correctly', () => {
    const prompt = engine.buildPlanningPrompt('Build API', { history: [] });
    
    assert.ok(prompt.includes('Build API'));
    assert.ok(prompt.includes('JSON'));
  });

  it('should parse plan response', () => {
    const response = JSON.stringify({
      tasks: [{ id: 't1', description: 'Test task', dependencies: [], priority: 5, estimatedComplexity: 'low' }],
      summary: 'Test summary'
    });
    
    const plan = engine.parsePlanResponse(response, 'Test');
    
    assert.ok(plan, 'Plan should exist');
    assert.ok(plan.tasks, 'Tasks should exist');
    assert.ok(plan.tasks.length > 0, 'Should have tasks');
    assert.ok(plan.summary, 'Should have summary');
  });

  it('should track planning history', async () => {
    await engine.plan('Goal 1');
    await engine.plan('Goal 2');
    
    assert.equal(engine.planHistory.length, 2);
  });

  it('should clear history', async () => {
    await engine.plan('Test');
    engine.clearHistory();
    
    assert.equal(engine.planHistory.length, 0);
  });

  it('should detect parallelizable tasks', () => {
    const tasks = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: [] }
    ];
    
    assert.equal(engine.hasParallelizableTasks(tasks), true);
  });
});

// ============================================================================
// TaskDecomposer Tests
// ============================================================================

describe('TaskDecomposer', () => {
  let decomposer;

  beforeEach(() => {
    decomposer = new TaskDecomposer();
  });

  it('should initialize correctly', () => {
    assert.ok(decomposer.dependencyGraph);
    assert.ok(decomposer.priorityWeights);
  });

  it('should decompose simple plan', () => {
    const plan = {
      id: 'test-plan',
      tasks: [
        { id: 'task-1', dependencies: [], priority: 5 }
      ]
    };
    
    const result = decomposer.decompose(plan);
    
    assert.ok(result.orderedTasks);
    assert.ok(result.batches);
    assert.equal(result.planId, 'test-plan');
  });

  it('should create batches for parallel tasks', () => {
    const plan = {
      id: 'parallel-plan',
      tasks: [
        { id: 'a', dependencies: [], priority: 5 },
        { id: 'b', dependencies: [], priority: 5 },
        { id: 'c', dependencies: ['a', 'b'], priority: 5 }
      ]
    };
    
    const result = decomposer.decompose(plan);
    
    assert.ok(result.batches.length >= 2);
    assert.ok(result.batches[0].tasks.length >= 2); // a and b in first batch
  });

  it('should detect cycles', () => {
    const cyclicPlan = {
      id: 'cyclic',
      tasks: [
        { id: 'a', dependencies: ['b'] },
        { id: 'b', dependencies: ['a'] }
      ]
    };
    
    assert.throws(() => decomposer.decompose(cyclicPlan));
  });

  it('should calculate priority scores', () => {
    const plan = {
      id: 'priority-plan',
      tasks: [
        { id: 'high', dependencies: [], priority: 10, estimatedComplexity: 'low' },
        { id: 'low', dependencies: [], priority: 1, estimatedComplexity: 'high' }
      ]
    };
    
    const result = decomposer.decompose(plan);
    const highTask = result.orderedTasks.find(t => t.id === 'high');
    const lowTask = result.orderedTasks.find(t => t.id === 'low');
    
    assert.ok(highTask.priorityScore > lowTask.priorityScore);
  });

  it('should find critical path', () => {
    const plan = {
      id: 'path-plan',
      tasks: [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['b'] }
      ]
    };
    
    const result = decomposer.decompose(plan);
    
    assert.deepEqual(result.metadata.criticalPath, ['a', 'b', 'c']);
  });
});

// ============================================================================
// ExecutionController Tests
// ============================================================================

describe('ExecutionController', () => {
  let executor;

  beforeEach(() => {
    executor = new ExecutionController({ maxConcurrency: 2, taskTimeout: 5000 });
  });

  it('should initialize with options', () => {
    assert.equal(executor.maxConcurrency, 2);
    assert.equal(executor.taskTimeout, 5000);
  });

  it('should initialize metrics', () => {
    const metrics = executor.initMetrics();
    
    assert.equal(metrics.totalTasks, 0);
    assert.equal(metrics.completed, 0);
    assert.equal(metrics.failed, 0);
  });

  it('should chunk arrays correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = executor.chunkArray(arr, 2);
    
    assert.equal(chunks.length, 3);
    assert.deepEqual(chunks[0], [1, 2]);
  });

  it('should execute simple plan', async () => {
    const decomposed = {
      planId: 'exec-test',
      orderedTasks: [{ id: 't1', description: 'Test' }],
      batches: [{ id: 'b1', tasks: [{ id: 't1', description: 'Test' }], canParallelize: true }]
    };
    
    const results = await executor.execute(decomposed);
    
    assert.ok(results.status);
    assert.ok(results.metrics);
  });

  it('should track circuit breaker state', () => {
    assert.equal(executor.circuitBreaker.isOpen, false);
    assert.equal(executor.circuitBreaker.failures, 0);
  });

  it('should get metrics', () => {
    const metrics = executor.getMetrics();
    assert.ok('totalTasks' in metrics);
  });
});

// ============================================================================
// ValidationLayer Tests
// ============================================================================

describe('ValidationLayer', () => {
  let validator;

  beforeEach(() => {
    validator = new ValidationLayer({ strictness: 'normal' });
  });

  it('should initialize with strictness', () => {
    assert.equal(validator.strictness, 'normal');
  });

  it('should validate simple result', () => {
    const result = validator.validate({ success: true }, {});
    
    assert.equal(result.valid, true);
  });

  it('should validate schema type', () => {
    const result = validator.validate('string value', {
      schema: { type: 'string' }
    });
    
    assert.equal(result.valid, true);
  });

  it('should fail invalid schema type', () => {
    const result = validator.validate('string', {
      schema: { type: 'number' }
    });
    
    assert.equal(result.valid, false);
  });

  it('should validate required fields', () => {
    const result = validator.validate({ name: 'test' }, {
      schema: { required: ['name', 'value'] }
    });
    
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('value')));
  });

  it('should validate regex match', () => {
    const result = validator.validate('SUCCESS', {
      regex: { match: 'SUCCESS' }
    });
    
    assert.equal(result.valid, true);
  });

  it('should validate regex notMatch', () => {
    const result = validator.validate('ERROR occurred', {
      regex: { notMatch: 'ERROR' }
    });
    
    assert.equal(result.valid, false);
  });

  it('should support custom validators', () => {
    validator.addValidator('isPositive', (result) => ({
      valid: result > 0,
      errors: result <= 0 ? ['Must be positive'] : []
    }));
    
    const result = validator.validate(-5, { isPositive: true });
    
    assert.equal(result.valid, false);
  });

  it('should track validation history', () => {
    validator.validate({}, {});
    validator.validate({}, {});
    
    assert.equal(validator.getHistory().length, 2);
  });

  it('should get summary', () => {
    validator.validate({ valid: true }, {});
    const summary = validator.getSummary();
    
    assert.equal(summary.total, 1);
  });
});

// ============================================================================
// MemoryBridge Tests
// ============================================================================

describe('MemoryBridge', () => {
  let memory;

  beforeEach(() => {
    memory = new MemoryBridge({ sessionId: 'test-session' });
  });

  it('should initialize with session ID', () => {
    assert.equal(memory.sessionId, 'test-session');
  });

  it('should save context', async () => {
    const id = await memory.saveContext('goal', { test: true });
    
    assert.ok(id.startsWith('ctx-'));
  });

  it('should save different context types', async () => {
    await memory.saveContext('goal', { g: 1 });
    await memory.saveContext('plan', { p: 1 });
    await memory.saveContext('result', { r: 1 });
    await memory.saveContext('learning', { l: 1 });
    
    const ctx = await memory.loadContext({});
    
    assert.ok(ctx.goals.length > 0);
    assert.ok(ctx.plans.length > 0);
    assert.ok(ctx.taskResults.length > 0);
    assert.ok(ctx.learnings.length > 0);
  });

  it('should filter by type', async () => {
    await memory.saveContext('goal', { test: 1 });
    
    const ctx = await memory.loadContext({ type: 'goal' });
    
    assert.ok(ctx.goal || ctx.goals);
  });

  it('should search context', async () => {
    await memory.saveContext('learning', { insight: 'async await patterns' });
    
    const results = await memory.searchRelevant('async');
    
    assert.ok(Array.isArray(results));
  });

  it('should clear session', async () => {
    await memory.saveContext('goal', { test: 1 });
    await memory.clearSession();
    
    const ctx = await memory.loadContext({});
    
    assert.equal(ctx.goals.length, 0);
  });

  it('should export session', async () => {
    await memory.saveContext('goal', { export: true });
    
    const exported = memory.exportSession();
    
    assert.ok(exported.sessionId);
    assert.ok(exported.context);
  });

  it('should import session', () => {
    memory.importSession({
      sessionId: 'imported-session',
      context: { goals: [{ id: 'imported' }] }
    });
    
    assert.equal(memory.sessionId, 'imported-session');
  });

  it('should get summary', () => {
    const summary = memory.getSummary();
    
    assert.ok('goalCount' in summary);
    assert.ok('sessionId' in summary);
  });
});

// ============================================================================
// ApprovalGates Tests
// ============================================================================

describe('ApprovalGates', () => {
  let gates;

  beforeEach(() => {
    gates = new ApprovalGates();
  });

  it('should initialize empty', () => {
    assert.equal(gates.approvals.size, 0);
    assert.equal(gates.pending.size, 0);
  });

  it('should request approval', () => {
    gates.requestApproval('architecture');
    
    assert.ok(gates.pending.has('architecture'));
  });

  it('should approve gate', () => {
    gates.requestApproval('security');
    gates.approve('security');
    
    assert.ok(gates.isApproved('security'));
    assert.ok(!gates.pending.has('security'));
  });

  it('should get pending approvals', () => {
    gates.requestApproval('deploy');
    
    assert.deepEqual(gates.getPending(), ['deploy']);
  });

  it('should reset approvals', () => {
    gates.requestApproval('test');
    gates.approve('test');
    gates.reset();
    
    assert.equal(gates.approvals.size, 0);
    assert.equal(gates.pending.size, 0);
  });

  it('should check if gate requires approval', () => {
    assert.ok(gates.requiresApproval('architecture'));
    assert.ok(gates.requiresApproval('security'));
  });
});

describe('AUTONOMOUS_GATES', () => {
  it('should have architecture gate', () => {
    assert.ok(AUTONOMOUS_GATES.architecture);
    assert.ok(AUTONOMOUS_GATES.architecture.check);
  });

  it('should have security gate', () => {
    assert.ok(AUTONOMOUS_GATES.security);
    assert.equal(AUTONOMOUS_GATES.security.blocking, true);
  });

  it('should check security gate for sensitive data', () => {
    const gate = AUTONOMOUS_GATES.security;
    
    assert.equal(gate.check({ data: 'safe' }), true);
    assert.equal(gate.check({ password: '123' }), false);
  });

  it('should have quality gate', () => {
    assert.ok(AUTONOMOUS_GATES.quality);
    assert.equal(AUTONOMOUS_GATES.quality.blocking, false);
  });
});
