import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowStore, NodeState, ExecutionHistory } from '../../memory/workflowStore.js';
import { ContextCollector } from '../../memory/contextCollector.js';

const TEST_DIR = path.join(process.cwd(), '.ultra-dex-test', 'workflows');

async function cleanup() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
}

function createNodeState(id: string, state: NodeState['state'] = 'CREATED'): NodeState {
  return {
    nodeId: id,
    taskType: 'test',
    state,
    input: { test: true },
    executedAt: new Date().toISOString()
  };
}

function createHistory(): ExecutionHistory {
  return {
    attempt: 1,
    status: 'SUCCESS',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 100,
    cost: { tokens: 10, estimatedUSD: 0.01, provider: 'mock' }
  };
}

test('WorkflowStore', async (t) => {
  await cleanup();

  await t.test('createWorkflow() initializes memory', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const memory = store.createWorkflow('wf-1');
    assert.strictEqual(memory.workflowId, 'wf-1');
    assert.strictEqual(memory.status, 'CREATED');
    assert.strictEqual(memory.nodes.size, 0);
    assert.strictEqual(memory.metrics.totalDuration, 0);
  });

  await t.test('updateNode() updates node state', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-2');
    const node = createNodeState('n1', 'RUNNING');
    store.updateNode('wf-2', node);
    
    const wf = store.getWorkflow('wf-2');
    assert.strictEqual(wf?.nodes.get('n1')?.state, 'RUNNING');
  });

  await t.test('saveWorkflow() and loadWorkflow() writes and reads JSON from disk', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-3');
    store.updateNode('wf-3', createNodeState('n1', 'SUCCESS'));
    store.addHistory('wf-3', 'n1', createHistory());
    
    await store.saveWorkflow('wf-3');
    
    // Create new store to load from disk
    const store2 = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const memory = await store2.loadWorkflow('wf-3');
    
    assert.ok(memory);
    assert.strictEqual(memory.workflowId, 'wf-3');
    assert.strictEqual(memory.nodes.get('n1')?.state, 'SUCCESS');
    assert.strictEqual(memory.nodeHistory.get('n1')?.length, 1);
  });

  await t.test('loadAllWorkflows() finds all saved workflows', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-4a');
    store.createWorkflow('wf-4b');
    await store.saveWorkflow('wf-4a');
    await store.saveWorkflow('wf-4b');
    
    const store2 = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const all = await store2.loadAllWorkflows();
    
    const ids = all.map(w => w.workflowId);
    assert.ok(ids.includes('wf-4a'));
    assert.ok(ids.includes('wf-4b'));
  });

  await t.test('deleteWorkflow() removes file', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-5');
    await store.saveWorkflow('wf-5');
    
    await store.deleteWorkflow('wf-5');
    const memory = await store.loadWorkflow('wf-5');
    assert.strictEqual(memory, undefined);
  });

  await t.test('metrics accumulate across attempts', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-6');
    store.addHistory('wf-6', 'n1', createHistory()); // duration 100, tokens 10
    store.addHistory('wf-6', 'n1', createHistory()); // duration 100, tokens 10
    
    const memory = store.getWorkflow('wf-6')!;
    assert.strictEqual(memory.metrics.totalDuration, 200);
    assert.strictEqual(memory.metrics.totalCost.tokens, 20);
    assert.strictEqual(memory.metrics.successCount, 2);
  });

  await t.test('getDependencyOutputs() collects from dependencies', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-7');
    store.updateNode('wf-7', createNodeState('n1'));
    store.updateNode('wf-7', createNodeState('n2'));
    
    store.setNodeOutput('wf-7', 'n1', { a: 1 });
    store.setNodeOutput('wf-7', 'n2', { b: 2 });
    
    const outputs = store.getDependencyOutputs('wf-7', 'n3', ['n1', 'n2']);
    assert.deepStrictEqual((outputs['n1'] as any).a, 1);
    assert.deepStrictEqual((outputs['n2'] as any).b, 2);
  });

  await t.test('flush() saves all dirty workflows', async () => {
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: true, saveInterval: 10000 });
    store.createWorkflow('wf-8');
    store.updateNode('wf-8', createNodeState('n1')); // triggers autoSave queue
    
    await store.flush();
    
    const store2 = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const memory = await store2.loadWorkflow('wf-8');
    assert.ok(memory);
  });

  await t.test('ContextCollector.collect() merges context', () => {
    const deps = { n1: { result: 'A' } };
    const input = { base: 'B' };
    
    const collected = ContextCollector.collect(deps, input);
    assert.strictEqual(collected.base, 'B');
    assert.deepStrictEqual(collected.n1, { result: 'A' });
    assert.deepStrictEqual(collected._dependencies, deps);
  });

  await t.test('ContextCollector.extract() pulls fields', () => {
    const context = { a: 1, b: 2, c: 3 };
    const extracted = ContextCollector.extract(context, ['a', 'c']);
    assert.deepStrictEqual(extracted, { a: 1, c: 3 });
  });

  await t.test('Crash recovery: start workflow, save state, kill, reload, resume', async () => {
    await cleanup();
    const wfId = 'crash-wf-1';
    
    // Simulate Run 1 (crashes mid-way)
    const store1 = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store1.createWorkflow(wfId);
    store1.updateNode(wfId, createNodeState('n1', 'SUCCESS'));
    store1.setNodeOutput(wfId, 'n1', { output1: 'done' });
    store1.addHistory(wfId, 'n1', createHistory());
    store1.updateNode(wfId, createNodeState('n2', 'RUNNING')); // crash happens here
    await store1.saveWorkflow(wfId);
    
    // ... CRASH ...
    
    // Simulate Run 2 (recovery)
    const store2 = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const recovered = await store2.loadWorkflow(wfId);
    
    assert.ok(recovered);
    assert.strictEqual(recovered.nodes.get('n1')?.state, 'SUCCESS');
    assert.deepStrictEqual((recovered.nodes.get('n1')?.output as any).output1, 'done');
    assert.strictEqual(recovered.nodes.get('n2')?.state, 'RUNNING');
    assert.strictEqual(recovered.nodeHistory.get('n1')?.length, 1);
    assert.strictEqual(recovered.metrics.successCount, 1);
  });

  await cleanup();
});
