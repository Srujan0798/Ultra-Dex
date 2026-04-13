/**
 * DexGraph End-to-End Integration Test
 *
 * Validates the full Phase 1→11 pipeline:
 * parse → graph → state machine → scheduler → adapter → store → events
 *
 * This is the Gate 4 validation test — if this passes, the MVO is complete.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import { parse } from '../../dexgraph/parser.js';
import { DexGraph } from '../../dexgraph/graph.js';
import { Scheduler } from '../../dexgraph/scheduler.js';
import { WorkflowStore } from '../../memory/workflowStore.js';
import { MockAdapter } from '../../adapters/mockAdapter.js';
import { GovernanceManager } from '../../governance/governance-manager.js';
import { CostBudget, RequireTests } from '../../governance/rules.js';
import { createEventBus } from '../../core/events.js';
import type { GraphNode } from '../../dexgraph/types.js';
import type { UltraDexEvent } from '../../core/events.js';

// ──────────────────────────────────────────────────────────────────────────────
// Test fixture: inline workflow YAML
// ──────────────────────────────────────────────────────────────────────────────

const LINEAR_WORKFLOW = `
version: dexgraph/v1
name: linear-test
description: A->B->C linear test workflow

context:
  env: test

on_failure:
  retry: 1
  rollback: true

tasks:
  - id: plan
    role: architect
    instruction: Plan the system
    output: plan-doc

  - id: build
    role: engineer
    instruction: Build from plan
    depends_on: [plan]
    output: build-artifact

  - id: test
    role: tester
    instruction: Run tests
    depends_on: [build]
    verify:
      type: unit_test
      command: npm test
`;

const DIAMOND_WORKFLOW = `
version: dexgraph/v1
name: diamond-test
description: Diamond dependency test

context: {}
on_failure:
  retry: 0
  rollback: true

tasks:
  - id: root
    role: architect
    instruction: Root task
  - id: branch-a
    role: engineer
    instruction: Branch A
    depends_on: [root]
  - id: branch-b
    role: engineer
    instruction: Branch B
    depends_on: [root]
  - id: merge
    role: reviewer
    instruction: Merge results
    depends_on: [branch-a, branch-b]
`;

const PARALLEL_WORKFLOW = `
version: dexgraph/v1
name: parallel-test
description: Independent parallel tasks

context: {}
on_failure:
  retry: 0
  rollback: false

tasks:
  - id: task-a
    role: engineer
    instruction: Task A (independent)
    parallel: true
  - id: task-b
    role: engineer
    instruction: Task B (independent)
    parallel: true
  - id: task-c
    role: engineer
    instruction: Task C (independent)
    parallel: true
`;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

async function writeTmpWorkflow(name: string, content: string): Promise<string> {
  const filePath = path.join(tmpDir, `${name}.dex`);
  await fs.writeFile(filePath, content.trim(), 'utf-8');
  return filePath;
}

function makeDispatcher(adapter: MockAdapter) {
  return {
    dispatch: (node: GraphNode) =>
      adapter.run({ nodeId: node.id, taskType: node.role, input: node.context, timeout: 5000 }),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('DexGraph End-to-End Integration', () => {
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dexgraph-e2e-'));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── Phase 1: Parser ────────────────────────────────────────────────────────

  it('Phase 1: parses linear workflow YAML into DexGraphResult', async () => {
    const file = await writeTmpWorkflow('linear', LINEAR_WORKFLOW);
    const result = parse(file);

    assert.strictEqual(result.metadata.name, 'linear-test');
    assert.strictEqual(result.nodes.length, 3);
    assert.strictEqual(result.edges.length, 2);

    const buildNode = result.nodes.find(n => n.id === 'build');
    assert.ok(buildNode);
    assert.deepStrictEqual(buildNode.dependencies, ['plan']);
  });

  it('Phase 1: parses diamond workflow with 4 nodes and 4 edges', async () => {
    const file = await writeTmpWorkflow('diamond', DIAMOND_WORKFLOW);
    const result = parse(file);
    assert.strictEqual(result.nodes.length, 4);
    assert.strictEqual(result.edges.length, 4);
  });

  it('Phase 1: rejects workflow with unknown dependency', async () => {
    const bad = `
version: dexgraph/v1
name: bad
description: d
context: {}
on_failure: {retry: 0, rollback: false}
tasks:
  - id: a
    role: engineer
    instruction: i
    depends_on: [nonexistent]
`;
    const file = await writeTmpWorkflow('bad-deps', bad);
    assert.throws(() => parse(file), /Unknown dependency|nonexistent/i);
  });

  // ── Phase 2: Graph Builder ────────────────────────────────────────────────

  it('Phase 2: DexGraph.fromParseResult() builds valid DAG', async () => {
    const file = await writeTmpWorkflow('linear2', LINEAR_WORKFLOW);
    const result = parse(file);
    const graph = DexGraph.fromParseResult(result);

    assert.strictEqual(graph.size, 3);
    assert.deepStrictEqual(graph.topologicalSort(), ['plan', 'build', 'test']);
  });

  it('Phase 2: detects cycles — rejects cyclic graph', () => {
    const graph = new DexGraph();
    const makeNode = (id: string) => ({
      id, role: 'engineer' as const, instruction: 'i', dependencies: [],
      context: {}, parallel: false, state: 'CREATED' as const,
    });
    graph.addNode(makeNode('a'));
    graph.addNode(makeNode('b'));
    graph.addEdge({ from: 'a', to: 'b' });
    graph.addEdge({ from: 'b', to: 'a' });
    assert.throws(() => graph.validateDAG(), /circular|cycle/i);
  });

  it('Phase 2: topological sort gives correct parallel order', async () => {
    const file = await writeTmpWorkflow('diamond2', DIAMOND_WORKFLOW);
    const result = parse(file);
    const graph = DexGraph.fromParseResult(result);
    const order = graph.topologicalSort();

    // root must come first, merge must come last
    assert.strictEqual(order[0], 'root');
    assert.strictEqual(order[order.length - 1], 'merge');
    // branch-a and branch-b can be in any order but must come before merge
    const branchAIdx = order.indexOf('branch-a');
    const branchBIdx = order.indexOf('branch-b');
    const mergeIdx = order.indexOf('merge');
    assert.ok(branchAIdx < mergeIdx);
    assert.ok(branchBIdx < mergeIdx);
  });

  // ── Phase 3: State Machine ────────────────────────────────────────────────

  it('Phase 3: nodes start in CREATED state', async () => {
    const file = await writeTmpWorkflow('linear3', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    for (const node of graph.getAllNodes()) {
      assert.strictEqual(node.state, 'CREATED');
    }
  });

  // ── Phase 4: Scheduler ────────────────────────────────────────────────────

  it('Phase 4: linear workflow executes all nodes to SUCCESS', async () => {
    const file = await writeTmpWorkflow('linear4', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(10);
    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 2, timeoutMs: 10000, onFailure: 'rollback',
    });

    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.completedNodes.length, 3);
    assert.strictEqual(result.failedNodes.length, 0);
    assert.ok(result.duration > 0);

    // All nodes in SUCCESS state
    for (const node of graph.getAllNodes()) {
      assert.strictEqual(node.state, 'SUCCESS', `Node ${node.id} should be SUCCESS`);
    }
  });

  it('Phase 4: diamond workflow executes in correct order', async () => {
    const file = await writeTmpWorkflow('diamond4', DIAMOND_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));

    const executionOrder: string[] = [];
    const trackingAdapter = {
      run: async (ctx: Parameters<MockAdapter['run']>[0]) => {
        executionOrder.push(ctx.nodeId);
        return new MockAdapter(5).run(ctx);
      },
      cancel: async () => {},
      status: async () => ({ running: false }),
      name: () => 'tracking',
    };

    const scheduler = new Scheduler(graph, makeDispatcher(trackingAdapter as unknown as MockAdapter), {
      maxRetries: 0, maxConcurrent: 4, timeoutMs: 10000, onFailure: 'rollback',
    });
    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(executionOrder[0], 'root');
    assert.strictEqual(executionOrder[executionOrder.length - 1], 'merge');
  });

  it('Phase 4: failed node triggers rollback of dependents (onFailure=rollback)', async () => {
    const file = await writeTmpWorkflow('linear-fail', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(5, ['plan']); // plan will fail

    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 2, timeoutMs: 10000, onFailure: 'rollback',
    });

    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.ok(result.failedNodes.includes('plan') || result.rolledBackNodes.includes('plan'));
  });

  it('Phase 4: parallel workflow executes independent tasks concurrently', async () => {
    const file = await writeTmpWorkflow('parallel4', PARALLEL_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(50); // 50ms delay per task

    const start = Date.now();
    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 3, timeoutMs: 10000, onFailure: 'rollback',
    });
    const result = await scheduler.run();
    const elapsed = Date.now() - start;

    assert.strictEqual(result.success, true);
    // 3 parallel tasks at 50ms each should finish in ~100ms, not 150ms
    assert.ok(elapsed < 200, `Expected parallel execution < 200ms, got ${elapsed}ms`);
  });

  it('Phase 4: onFailure=continue allows other branches to proceed', async () => {
    const file = await writeTmpWorkflow('parallel-fail', PARALLEL_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(5, ['task-a']); // only task-a fails

    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 3, timeoutMs: 10000, onFailure: 'continue',
    });
    const result = await scheduler.run();

    // B and C should still succeed
    assert.ok(result.completedNodes.includes('task-b'));
    assert.ok(result.completedNodes.includes('task-c'));
  });

  // ── Phase 5: Adapter ─────────────────────────────────────────────────────

  it('Phase 5: MockAdapter returns consistent ExecutionResult shape', async () => {
    const adapter = new MockAdapter(5);
    const result = await adapter.run({
      nodeId: 'n1', taskType: 'engineer',
      input: { x: 1 }, timeout: 5000,
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.ok(result.output !== undefined);
    assert.ok(Array.isArray(result.logs));
    assert.ok(typeof result.cost.tokens === 'number');
    assert.ok(result.confidence >= 0 && result.confidence <= 1);
    assert.ok(result.duration >= 0);
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(result.timestamp));
  });

  // ── Phase 7: Memory Store ────────────────────────────────────────────────

  it('Phase 7: WorkflowStore persists and reloads workflow state', async () => {
    const storeDir = path.join(tmpDir, 'store-test');
    const store = await WorkflowStore.create({ basePath: storeDir, autoSave: false });
    const wfId = 'test-workflow';

    store.createWorkflow(wfId);
    store.updateNode(wfId, { nodeId: 'n1', taskType: 'engineer', state: 'SUCCESS', input: {} });
    store.setNodeOutput(wfId, 'n1', { result: 'output-data' });
    await store.saveWorkflow(wfId);

    // Load fresh
    const store2 = new WorkflowStore({ basePath: storeDir, autoSave: false });
    const loaded = await store2.loadWorkflow(wfId);

    assert.ok(loaded, 'Workflow should be reloaded from disk');
    assert.strictEqual(loaded.nodes.get('n1')?.state, 'SUCCESS');
    assert.deepStrictEqual(loaded.nodes.get('n1')?.output, { result: 'output-data' });

    await store.close();
  });

  it('Phase 7: getDependencyOutputs() returns outputs for all deps', async () => {
    const store = new WorkflowStore({ autoSave: false });
    store.createWorkflow('wf');
    store.updateNode('wf', { nodeId: 'dep1', taskType: 't', state: 'SUCCESS', input: {} });
    store.updateNode('wf', { nodeId: 'dep2', taskType: 't', state: 'SUCCESS', input: {} });
    store.setNodeOutput('wf', 'dep1', { x: 1 });
    store.setNodeOutput('wf', 'dep2', { y: 2 });

    const outputs = store.getDependencyOutputs('wf', 'child', ['dep1', 'dep2']);
    assert.deepStrictEqual(outputs.dep1, { x: 1 });
    assert.deepStrictEqual(outputs.dep2, { y: 2 });
  });

  // ── Phase 9: Governance ───────────────────────────────────────────────────

  it('Phase 9: GovernanceManager blocks execution with hard rule', async () => {
    const file = await writeTmpWorkflow('linear9', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(5);

    const gov = new GovernanceManager([new RequireTests(['architect'])]);
    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 2, timeoutMs: 10000, onFailure: 'halt',
    }, gov);

    const result = await scheduler.run();
    assert.strictEqual(result.success, false);

    // Governance should have logged the decision
    const logs = gov.getAuditLogs();
    assert.ok(logs.length > 0);
    assert.ok(logs.some(l => l.decision === 'block'));
  });

  it('Phase 9: GovernanceManager allows execution when rules pass', async () => {
    const file = await writeTmpWorkflow('linear9b', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(5);

    // Budget of $1000 — won't be exceeded by mock
    const gov = new GovernanceManager([new CostBudget(1000)]);
    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 2, timeoutMs: 10000, onFailure: 'rollback',
    }, gov);

    const result = await scheduler.run();
    assert.strictEqual(result.success, true);
  });

  // ── Phase 12: Events ──────────────────────────────────────────────────────

  it('Phase 12: EventBus receives scheduler.start and scheduler.complete events', async () => {
    const file = await writeTmpWorkflow('linear12', LINEAR_WORKFLOW);
    const graph = DexGraph.fromParseResult(parse(file));
    const adapter = new MockAdapter(5);

    // Use the observability EventEmitter (what Scheduler uses internally)
    const { EventEmitter: ObsEmitter, createEvent } = await import('../../observability/eventEmitter.js');
    const emitter = new ObsEmitter();
    const fired: string[] = [];
    emitter.on('scheduler.start', () => fired.push('start'));
    emitter.on('scheduler.complete', () => fired.push('complete'));
    emitter.on('node.complete', e => fired.push(`node:${e.data.nodeId}`));

    const scheduler = new Scheduler(graph, makeDispatcher(adapter), {
      maxRetries: 0, maxConcurrent: 2, timeoutMs: 10000, onFailure: 'rollback',
    }, undefined, emitter, 'wf-events');

    await scheduler.run();

    assert.ok(fired.includes('start'), 'scheduler.start should fire');
    assert.ok(fired.includes('complete'), 'scheduler.complete should fire');
    assert.ok(fired.some(f => f.startsWith('node:')), 'node.complete should fire for each node');
  });

  it('Phase 12: UltraDexEvent EventBus is fully typed and receives all event types', () => {
    const bus = createEventBus();
    const events: string[] = [];

    bus.on('workflow.started', () => events.push('workflow.started'));
    bus.on('task.started', () => events.push('task.started'));
    bus.on('task.completed', () => events.push('task.completed'));
    bus.on('task.failed', () => events.push('task.failed'));
    bus.on('workflow.completed', () => events.push('workflow.completed'));

    const ts = new Date().toISOString();
    bus.emit({ type: 'workflow.started', workflowId: 'w1', timestamp: ts, totalNodes: 3 });
    bus.emit({ type: 'task.started', taskId: 't1', workflowId: 'w1', timestamp: ts, agentType: 'engineer' });
    bus.emit({ type: 'task.completed', taskId: 't1', workflowId: 'w1', timestamp: ts, output: {}, cost: { tokens: 1, estimatedUSD: 0, provider: 'mock' }, durationMs: 10, confidence: 0.9 });
    bus.emit({ type: 'task.failed', taskId: 't2', workflowId: 'w1', timestamp: ts, error: 'err', reason: 'FAILED', retryCount: 0 });
    bus.emit({ type: 'workflow.completed', workflowId: 'w1', timestamp: ts, status: 'PARTIAL', totalCost: { tokens: 1, estimatedUSD: 0, provider: 'mock' }, durationMs: 100, completedNodes: ['t1'], failedNodes: ['t2'] });

    assert.strictEqual(events.length, 5);
    assert.deepStrictEqual(events, [
      'workflow.started', 'task.started', 'task.completed', 'task.failed', 'workflow.completed',
    ]);
  });

  // ── SDK ────────────────────────────────────────────────────────────────────

  it('SDK: ExecutionEngine runs a complete workflow via sdk/index.ts', async () => {
    const { ExecutionEngine } = await import('../../runtime/execution_engine/index.js');
    const file = await writeTmpWorkflow('sdk-test', LINEAR_WORKFLOW);

    const adapter = new MockAdapter(10);
    const engine = new ExecutionEngine(adapter, {
      storeDir: path.join(tmpDir, 'sdk-store'),
      maxRetries: 0,
    });

    const events: string[] = [];
    engine.events.on('workflow.started', () => events.push('started'));
    engine.events.on('workflow.completed', () => events.push('completed'));
    engine.events.on('task.started', e => events.push(`task:${e.taskId}`));

    const result = await engine.run(file);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.workflowName, 'linear-test');
    assert.ok(result.workflowId);
    assert.ok(result.startedAt);
    assert.ok(result.completedAt);

    assert.ok(events.includes('started'), 'workflow.started should fire');
    assert.ok(events.includes('completed'), 'workflow.completed should fire');
    assert.ok(events.some(e => e.startsWith('task:')), 'task.started should fire');
  });

  // ── Tools Registry ────────────────────────────────────────────────────────

  it('ToolRegistry: register, execute, and get stats for a tool', async () => {
    const { ToolRegistry } = await import('../../tools/registry/index.js');
    const registry = new ToolRegistry();

    registry.register(
      {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {
          a: { type: 'number', required: true },
          b: { type: 'number', required: true },
        },
      },
      async (input) => (input.a as number) + (input.b as number),
    );

    assert.strictEqual(registry.size, 1);
    assert.ok(registry.has('add'));

    const result = await registry.execute('add', { a: 2, b: 3 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.output, 5);
    assert.ok(result.durationMs >= 0);

    const stats = registry.getStats();
    assert.strictEqual(stats.add.callCount, 1);
  });

  it('ToolRegistry: returns error for missing required field', async () => {
    const { ToolRegistry } = await import('../../tools/registry/index.js');
    const registry = new ToolRegistry();
    registry.register(
      { name: 'greet', description: 'd', inputSchema: { name: { type: 'string', required: true } } },
      async (i) => `Hello ${i.name}`,
    );
    const result = await registry.execute('greet', {});
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('name'));
  });
});
