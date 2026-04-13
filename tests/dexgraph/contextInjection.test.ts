import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DexGraph } from '../../dexgraph/graph.js';
import { WorkflowStore, NodeState } from '../../memory/workflowStore.js';
import { ContextInjector } from '../../dexgraph/contextInjector.js';
import { GraphNode } from '../../dexgraph/types.js';
import { Dispatcher } from '../../dexgraph/dispatcher.js';
import { ExecutionAdapter, ExecutionContext, ExecutionResult } from '../../adapters/executionAdapter.js';

const TEST_DIR = path.join(process.cwd(), '.ultra-dex-test', 'context-inject');

async function cleanup() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
}

class MockAdapter implements ExecutionAdapter {
  public calls: Record<string, number> = {};
  public contexts: Record<string, ExecutionContext> = {};
  
  async run(context: ExecutionContext): Promise<ExecutionResult> {
    this.calls[context.nodeId] = (this.calls[context.nodeId] || 0) + 1;
    this.contexts[context.nodeId] = context;
    
    return {
      status: 'SUCCESS',
      output: { result: `data_${context.nodeId}` },
      logs: ['success'],
      cost: { tokens: 10, estimatedUSD: 0.001, provider: 'mock' },
      confidence: 1.0,
      duration: 10,
      timestamp: new Date().toISOString()
    };
  }

  async cancel() {}
  async status() { return { running: false }; }
  name() { return 'MockAdapter'; }
}

function createNode(id: string, state: NodeState['state'] = 'CREATED', contextData: any = {}): GraphNode {
  return {
    id,
    role: 'engineer',
    instruction: 'test',
    dependencies: [],
    context: { ...contextData },
    parallel: false,
    state: state as any,
  };
}

test('Context Injection', async (t) => {
  await cleanup();

  await t.test('collectDependencyOutputs() returns outputs from all deps', async () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const wfId = 'wf-1';
    store.createWorkflow(wfId);
    
    graph.addNode(createNode('A', 'SUCCESS'));
    graph.addNode(createNode('B', 'SUCCESS'));
    graph.addNode(createNode('C', 'CREATED'));
    graph.addEdge({ from: 'A', to: 'C' });
    graph.addEdge({ from: 'B', to: 'C' });

    store.updateNode(wfId, { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.updateNode(wfId, { nodeId: 'B', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput(wfId, 'A', { outA: 1 });
    store.setNodeOutput(wfId, 'B', { outB: 2 });

    const injector = new ContextInjector(graph, store, wfId);
    const outputs = injector.collectDependencyOutputs('C');
    
    assert.deepStrictEqual((outputs['A'] as any).outA, 1);
    assert.deepStrictEqual((outputs['B'] as any).outB, 2);
  });

  await t.test('areDependenciesSatisfied() true only when all deps SUCCESS', async () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const wfId = 'wf-2';
    store.createWorkflow(wfId);
    
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));
    graph.addNode(createNode('C'));
    graph.addEdge({ from: 'A', to: 'C' });
    graph.addEdge({ from: 'B', to: 'C' });

    const injector = new ContextInjector(graph, store, wfId);

    // Initial state
    assert.strictEqual(injector.areDependenciesSatisfied('C'), false);

    // One success
    store.updateNode(wfId, { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    assert.strictEqual(injector.areDependenciesSatisfied('C'), false);

    // Both success
    store.updateNode(wfId, { nodeId: 'B', state: 'SUCCESS', taskType: 't', input: {} });
    assert.strictEqual(injector.areDependenciesSatisfied('C'), true);
  });

  await t.test('waitForDependencies() blocks until deps complete', async () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    const wfId = 'wf-3';
    store.createWorkflow(wfId);
    
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));
    graph.addEdge({ from: 'A', to: 'B' });

    const injector = new ContextInjector(graph, store, wfId);

    setTimeout(() => {
      store.updateNode(wfId, { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
      store.setNodeOutput(wfId, 'A', { out: 'A' });
    }, 50);

    const outputs = await injector.waitForDependencies('B');
    assert.deepStrictEqual((outputs['A'] as any).out, 'A');
  });

  await t.test('getNodeInput() returns static input', () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    
    graph.addNode(createNode('A', 'CREATED', { staticVal: 123 }));
    const injector = new ContextInjector(graph, store, 'wf-x');
    
    assert.deepStrictEqual(injector.getNodeInput('A'), { staticVal: 123 });
  });

  await t.test('buildInjectionMetadata() merges dependency + static', () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf');
    
    graph.addNode(createNode('A', 'SUCCESS'));
    graph.addNode(createNode('B', 'CREATED', { staticVal: 1 }));
    graph.addEdge({ from: 'A', to: 'B' });
    
    store.updateNode('wf', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf', 'A', { outA: 2 });
    
    const injector = new ContextInjector(graph, store, 'wf');
    const meta = injector.buildInjectionMetadata('B');
    
    assert.strictEqual(meta.injectedContext.staticVal, 1);
    assert.deepStrictEqual(meta.injectedContext.A, { outA: 2 });
  });

  await t.test('injectContext() stores metadata on node', () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf');
    
    graph.addNode(createNode('A', 'SUCCESS'));
    graph.addNode(createNode('B', 'CREATED'));
    graph.addEdge({ from: 'A', to: 'B' });
    
    store.updateNode('wf', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf', 'A', { outA: 2 });
    
    const injector = new ContextInjector(graph, store, 'wf');
    injector.injectContext('B');
    
    const nodeB = graph.getNode('B');
    assert.ok(nodeB.context?.contextInjection);
    assert.deepStrictEqual((nodeB.context.contextInjection as any).dependencyOutputs.A, { outA: 2 });
  });

  await t.test('buildExecutionContext() includes injected values', () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf');
    
    graph.addNode(createNode('A', 'SUCCESS'));
    graph.addNode(createNode('B', 'CREATED', { base: 1 }));
    graph.addEdge({ from: 'A', to: 'B' });
    
    store.updateNode('wf', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf', 'A', { result: 'A' });
    
    const injector = new ContextInjector(graph, store, 'wf');
    const ctx = injector.buildExecutionContext('B');
    
    assert.strictEqual(ctx.base, 1);
    assert.deepStrictEqual(ctx.A, { result: 'A' });
  });

  await t.test('isContextReady() checks readiness', () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf');
    
    graph.addNode(createNode('A', 'SUCCESS'));
    graph.addNode(createNode('B', 'CREATED'));
    graph.addEdge({ from: 'A', to: 'B' });
    
    const injector = new ContextInjector(graph, store, 'wf');
    assert.strictEqual(injector.isContextReady('B'), false);
    
    store.updateNode('wf', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    assert.strictEqual(injector.isContextReady('B'), true);
  });

  await t.test('Multi-step workflow A->B->C: No re-prompting', async () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-multi');
    
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));
    graph.addNode(createNode('C'));
    graph.addEdge({ from: 'A', to: 'B' });
    graph.addEdge({ from: 'B', to: 'C' });

    const adapter = new MockAdapter();
    const injector = new ContextInjector(graph, store, 'wf-multi');
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter }, injector);

    // Node A
    await dispatcher.dispatchWithContext(graph.getNode('A'));
    const resA = dispatcher.getResult('A')!;
    store.updateNode('wf-multi', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf-multi', 'A', resA.output);
    graph.getNode('A').state = 'SUCCESS' as any;

    // Node B
    await dispatcher.dispatchWithContext(graph.getNode('B'));
    const resB = dispatcher.getResult('B')!;
    store.updateNode('wf-multi', { nodeId: 'B', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf-multi', 'B', resB.output);
    graph.getNode('B').state = 'SUCCESS' as any;

    // Node C
    await dispatcher.dispatchWithContext(graph.getNode('C'));
    
    assert.strictEqual(adapter.calls['A'], 1);
    assert.strictEqual(adapter.calls['B'], 1);
    assert.strictEqual(adapter.calls['C'], 1);

    const ctxC = adapter.contexts['C'].input;
    assert.deepStrictEqual((ctxC.B as any).result, 'data_B');
    // A isn't a direct dependency of C, so it shouldn't be directly in C's injected context unless B passed it on.
    // In our logic, only direct dependencies are collected.
  });

  await t.test('Diamond A->B,A->C,B->D,C->D', async () => {
    const graph = new DexGraph();
    const store = new WorkflowStore({ basePath: TEST_DIR, autoSave: false });
    store.createWorkflow('wf-diamond');
    
    ['A', 'B', 'C', 'D'].forEach(id => graph.addNode(createNode(id)));
    graph.addEdge({ from: 'A', to: 'B' });
    graph.addEdge({ from: 'A', to: 'C' });
    graph.addEdge({ from: 'B', to: 'D' });
    graph.addEdge({ from: 'C', to: 'D' });

    const adapter = new MockAdapter();
    const injector = new ContextInjector(graph, store, 'wf-diamond');
    const dispatcher = new Dispatcher({ maxConcurrent: 4, adapter }, injector);

    // Run A
    await dispatcher.dispatchWithContext(graph.getNode('A'));
    store.updateNode('wf-diamond', { nodeId: 'A', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf-diamond', 'A', { result: 'A' });
    graph.getNode('A').state = 'SUCCESS' as any;

    // Run B and C
    await Promise.all([
      dispatcher.dispatchWithContext(graph.getNode('B')),
      dispatcher.dispatchWithContext(graph.getNode('C'))
    ]);
    
    store.updateNode('wf-diamond', { nodeId: 'B', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf-diamond', 'B', { result: 'B' });
    graph.getNode('B').state = 'SUCCESS' as any;

    store.updateNode('wf-diamond', { nodeId: 'C', state: 'SUCCESS', taskType: 't', input: {} });
    store.setNodeOutput('wf-diamond', 'C', { result: 'C' });
    graph.getNode('C').state = 'SUCCESS' as any;

    // Run D
    await dispatcher.dispatchWithContext(graph.getNode('D'));
    
    const ctxD = adapter.contexts['D'].input;
    assert.deepStrictEqual((ctxD.B as any).result, 'B');
    assert.deepStrictEqual((ctxD.C as any).result, 'C');
  });

  await cleanup();
});
