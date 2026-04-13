import { test } from 'node:test';
import * as assert from 'node:assert';
import { Scheduler, Dispatcher } from '../../dexgraph/scheduler.js';
import { DexGraph } from '../../dexgraph/graph.js';
import { GraphNode } from '../../dexgraph/types.js';

class MockDispatcher implements Dispatcher {
  public callCount = 0;
  public lastNodeId?: string;
  private delay: number;

  constructor(delay: number = 10) {
    this.delay = delay;
  }

  async dispatch(node: GraphNode): Promise<any> {
    this.callCount++;
    this.lastNodeId = node.id;
    await new Promise(r => setTimeout(r, this.delay));
    return { success: true, output: `Result from ${node.id}` };
  }
}

class FailingDispatcher implements Dispatcher {
  public callCount: Record<string, number> = {};
  private succeedAfter: number;

  constructor(succeedAfter: number = 1) {
    this.succeedAfter = succeedAfter;
  }

  async dispatch(node: GraphNode): Promise<any> {
    this.callCount[node.id] = (this.callCount[node.id] || 0) + 1;
    if (this.callCount[node.id] <= this.succeedAfter) {
      throw new Error(`Intentional failure for ${node.id}`);
    }
    return { success: true };
  }
}

function createNode(id: string, state: NodeState = 'CREATED'): GraphNode {
  return {
    id,
    role: 'engineer',
    instruction: 'test',
    dependencies: [],
    context: {},
    parallel: false,
    state,
  };
}

test('Scheduler Integration', async (t) => {
  await t.test('linear execution A -> B -> C', async () => {
    const graph = new DexGraph();
    const nodes = ['A', 'B', 'C'].map(id => createNode(id));
    nodes.forEach(n => graph.addNode(n));
    graph.addEdge({ from: 'A', to: 'B' });
    graph.addEdge({ from: 'B', to: 'C' });

    const dispatcher = new MockDispatcher();
    const scheduler = new Scheduler(graph, dispatcher);
    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.completedNodes.length, 3);
    assert.deepStrictEqual(result.completedNodes.sort(), ['A', 'B', 'C']);
    assert.strictEqual(dispatcher.callCount, 3);
  });

  await t.test('parallel execution A, B', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));

    const dispatcher = new MockDispatcher();
    const scheduler = new Scheduler(graph, dispatcher, { maxConcurrent: 2 });
    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.completedNodes.length, 2);
    assert.strictEqual(dispatcher.callCount, 2);
  });

  await t.test('diamond execution A -> B, A -> C, B -> D, C -> D', async () => {
    const graph = new DexGraph();
    ['A', 'B', 'C', 'D'].map(id => createNode(id)).forEach(n => graph.addNode(n));
    graph.addEdge({ from: 'A', to: 'B' });
    graph.addEdge({ from: 'A', to: 'C' });
    graph.addEdge({ from: 'B', to: 'D' });
    graph.addEdge({ from: 'C', to: 'D' });

    const dispatcher = new MockDispatcher();
    const scheduler = new Scheduler(graph, dispatcher);
    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.completedNodes.length, 4);
    assert.strictEqual(graph.getNode('D').state, 'SUCCESS');
  });

  await t.test('failure with retry', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));

    const dispatcher = new FailingDispatcher(1); // Fail once, succeed on 2nd
    const scheduler = new Scheduler(graph, dispatcher, { maxRetries: 2 });
    const result = await scheduler.run();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.completedNodes[0], 'A');
    assert.strictEqual(dispatcher.callCount['A'], 2);
  });

  await t.test('failure with max retries exceeded -> ROLLBACK', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));

    const dispatcher = new FailingDispatcher(5); // Always fail
    const scheduler = new Scheduler(graph, dispatcher, { maxRetries: 2, onFailure: 'rollback' });
    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.strictEqual(graph.getNode('A').state, 'ROLLBACK');
    assert.strictEqual(result.rolledBackNodes.includes('A'), true);
  });

  await t.test('halt policy stops execution', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B')); // independent, but should halt if A fails

    const dispatcher = new FailingDispatcher(10);
    const scheduler = new Scheduler(graph, dispatcher, { maxRetries: 0, onFailure: 'halt' });
    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.ok(graph.getNode('A').state === 'FAILED' || graph.getNode('B').state === 'FAILED');
  });

  await t.test('rollback propagates to dependents', async () => {
    const graph = new DexGraph();
    const nodeA = createNode('A');
    const nodeB = createNode('B');
    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addEdge({ from: 'A', to: 'B' });

    const dispatcher = new FailingDispatcher(10);
    const scheduler = new Scheduler(graph, dispatcher, { maxRetries: 0, onFailure: 'rollback' });
    const result = await scheduler.run();

    assert.strictEqual(graph.getNode('A').state, 'ROLLBACK');
    assert.strictEqual(graph.getNode('B').state, 'ROLLBACK');
    assert.strictEqual(result.rolledBackNodes.length, 2);
  });

  await t.test('timeout error', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));

    const dispatcher = new MockDispatcher(100); // 100ms task
    const scheduler = new Scheduler(graph, dispatcher, { timeoutMs: 20, maxRetries: 0 });
    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.ok(graph.getNodesByState('ROLLBACK').length > 0 || graph.getNodesByState('FAILED').length > 0);
  });

  await t.test('getStatus returns correct counts', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));

    const dispatcher = new MockDispatcher(50);
    const scheduler = new Scheduler(graph, dispatcher);
    
    const promise = scheduler.run();
    // Wait for dispatch
    await new Promise(r => setTimeout(r, 10));
    
    const status = scheduler.getStatus();
    assert.strictEqual(status.total, 2);
    assert.strictEqual(status.running, true);
    
    await promise;
    const finalStatus = scheduler.getStatus();
    assert.strictEqual(finalStatus.completed, 2);
  });

  await t.test('continue policy skips failed branch', async () => {
    const graph = new DexGraph();
    ['A', 'B', 'C'].map(id => createNode(id)).forEach(n => graph.addNode(n));
    graph.addEdge({ from: 'A', to: 'B' }); // B depends on A
    // C is independent

    const dispatcher = {
      dispatch: async (node: GraphNode) => {
        if (node.id === 'A') throw new Error('A fails');
        return { success: true };
      }
    };
    const scheduler = new Scheduler(graph, dispatcher, { maxRetries: 0, onFailure: 'continue' });
    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.strictEqual(graph.getNode('A').state, 'ROLLBACK');
    assert.strictEqual(graph.getNode('B').state, 'CREATED'); // Never ran
    assert.strictEqual(graph.getNode('C').state, 'SUCCESS'); // Independent ran successfully
  });

  await t.test('stop() halts in-progress execution', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('A'));
    graph.addNode(createNode('B'));
    graph.addEdge({ from: 'A', to: 'B' });

    const dispatcher = new MockDispatcher(200); // Takes 200ms
    const scheduler = new Scheduler(graph, dispatcher);
    
    const p = scheduler.run();
    await new Promise(r => setTimeout(r, 50));
    scheduler.stop();
    const result = await p;

    assert.strictEqual(result.success, false);
    // It will eventually finish the task, but scheduler loops stop
  });

  await t.test('deadlock detection', async () => {
    const graph = new DexGraph();
    const nodeA = createNode('A', 'CREATED');
    const nodeB = createNode('B', 'FAILED'); // Already failed
    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addEdge({ from: 'B', to: 'A' });

    const dispatcher = new MockDispatcher();
    const scheduler = new Scheduler(graph, dispatcher);
    const result = await scheduler.run();

    assert.strictEqual(result.success, false);
    assert.strictEqual(graph.getNode('A').state, 'CREATED');
  });
});

