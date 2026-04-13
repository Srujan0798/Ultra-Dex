import { test } from 'node:test';
import * as assert from 'node:assert';
import { StateMachine } from '../../dexgraph/stateMachine.ts';
import { GraphNode, NodeState } from '../../dexgraph/types.ts';
import { DexGraph } from '../../dexgraph/graph.ts';

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

test('StateMachine', async (t) => {
  await t.test('Transitions', async (t) => {
    await t.test('should allow valid transition CREATED -> READY', () => {
      const sm = new StateMachine();
      const node = createNode('t1');
      sm.transition(node, 'READY');
      assert.strictEqual(node.state, 'READY');
    });

    await t.test('should throw on invalid transition CREATED -> RUNNING', () => {
      const sm = new StateMachine();
      const node = createNode('t1');
      assert.throws(() => sm.transition(node, 'RUNNING'), /Invalid transition: CREATED → RUNNING/);
    });

    await t.test('should allow terminal flow RUNNING -> VERIFYING -> SUCCESS', () => {
      const sm = new StateMachine();
      const node = createNode('t1', 'RUNNING');
      sm.transition(node, 'VERIFYING');
      sm.transition(node, 'SUCCESS');
      assert.strictEqual(node.state, 'SUCCESS');
    });

    await t.test('terminal states should reject transitions', () => {
      const sm = new StateMachine();
      const node = createNode('t1', 'SUCCESS');
      assert.throws(() => sm.transition(node, 'READY'), /Invalid transition: SUCCESS → READY/);
    });
  });

  await t.test('Retry Logic', async (t) => {
    await t.test('should handle retries correctly', () => {
      const sm = new StateMachine();
      const node = createNode('t1', 'RUNNING');
      
      // First failure
      sm.transition(node, 'FAILED');
      assert.ok(sm.shouldRetry(node, 3));
      sm.handleFailure(node, 3);
      assert.strictEqual(node.state, 'RUNNING');
      assert.strictEqual(sm.getRetryCount('t1'), 1);

      // Second failure
      sm.transition(node, 'FAILED');
      sm.handleFailure(node, 3);
      assert.strictEqual(sm.getRetryCount('t1'), 2);

      // Third failure
      sm.transition(node, 'FAILED');
      sm.handleFailure(node, 3);
      assert.strictEqual(sm.getRetryCount('t1'), 3);

      // Fourth failure -> Rollback
      sm.transition(node, 'FAILED');
      assert.strictEqual(sm.shouldRetry(node, 3), false);
      sm.handleFailure(node, 3);
      assert.strictEqual(node.state, 'ROLLBACK');
    });

    await t.test('should calculate exponential backoff with cap', () => {
      const sm = new StateMachine();
      assert.strictEqual(sm.getBackoffMs(0), 1000);
      assert.strictEqual(sm.getBackoffMs(1), 2000);
      assert.strictEqual(sm.getBackoffMs(2), 4000);
      assert.strictEqual(sm.getBackoffMs(5), 30000); // capped
    });
  });

  await t.test('Rollback Propagation', () => {
    const sm = new StateMachine();
    const graph = new DexGraph();
    
    const nodeA = createNode('A', 'RUNNING');
    const nodeB = createNode('B', 'READY');
    const nodeC = createNode('C', 'CREATED');
    const nodeD = createNode('D', 'SUCCESS'); // Terminal, should stay SUCCESS

    [nodeA, nodeB, nodeC, nodeD].forEach(n => graph.addNode(n));
    graph.addEdge({ from: 'A', to: 'B' });
    graph.addEdge({ from: 'B', to: 'C' });

    const rolledBack = sm.rollback(nodeA, graph);
    
    assert.strictEqual(nodeA.state, 'ROLLBACK');
    assert.strictEqual(nodeB.state, 'ROLLBACK');
    assert.strictEqual(nodeC.state, 'ROLLBACK');
    assert.strictEqual(nodeD.state, 'SUCCESS'); // remained terminal
    assert.deepStrictEqual(rolledBack, ['A', 'B', 'C']);
  });

  await t.test('History', () => {
    const sm = new StateMachine();
    const node = createNode('t1');
    sm.transition(node, 'READY', 'Ready to run');
    sm.transition(node, 'RUNNING');
    
    const history = sm.getHistory('t1');
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].to, 'READY');
    assert.strictEqual(history[0].reason, 'Ready to run');
    assert.strictEqual(history[1].to, 'RUNNING');
  });

  await t.test('Unblocking', () => {
    const sm = new StateMachine();
    const node = createNode('t1', 'READY');
    sm.transition(node, 'BLOCKED', 'Waiting for review');
    sm.transition(node, 'READY', 'Review passed');
    assert.strictEqual(node.state, 'READY');
  });
});
