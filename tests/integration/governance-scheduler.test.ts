import { test } from 'node:test';
import * as assert from 'node:assert';
import { Scheduler, Dispatcher } from '../../dexgraph/scheduler.js';
import { DexGraph } from '../../dexgraph/graph.js';
import { GraphNode, NodeState } from '../../dexgraph/types.js';
import { GovernanceManager, ExecutionBlockedError } from '../../governance/governance-manager.js';
import { Rule, RuleDecision } from '../../governance/types.js';

class MockDispatcher implements Dispatcher {
  async dispatch(node: GraphNode) {
    return { success: true };
  }
}

function createNode(id: string, role: string = 'engineer'): GraphNode {
  return {
    id, role: role as any, instruction: 'test', dependencies: [], context: {}, parallel: false, state: 'CREATED'
  };
}

test('Governance and Scheduler Integration', async (t) => {
  await t.test('allow rule permits execution', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('n1'));

    const rule: Rule = { name: 'AllowAll', evaluate: () => ({ allowed: true, reason: 'ok' }) };
    const gov = new GovernanceManager([rule]);
    const scheduler = new Scheduler(graph, new MockDispatcher(), {}, gov);

    const result = await scheduler.run();
    assert.strictEqual(result.success, true);
    assert.strictEqual(graph.getNode('n1').state, 'SUCCESS');
    assert.strictEqual(gov.getAuditLogs().length, 1);
    assert.strictEqual(gov.getAuditLogs()[0].decision, 'allow');
  });

  await t.test('hard block fails node and halts execution', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('n1'));

    const rule: Rule = { name: 'BlockAll', evaluate: () => ({ allowed: false, reason: 'blocked', blockType: 'hard' }) };
    const gov = new GovernanceManager([rule]);
    const scheduler = new Scheduler(graph, new MockDispatcher(), { onFailure: 'halt' }, gov);

    const result = await scheduler.run();
    assert.strictEqual(result.success, false);
    assert.strictEqual(graph.getNode('n1').state, 'FAILED');
    
    const logs = gov.getAuditLogs();
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].decision, 'block');
  });

  await t.test('soft block pauses execution in BLOCKED state', async () => {
    const graph = new DexGraph();
    graph.addNode(createNode('n1'));

    const rule: Rule = { name: 'PauseAll', evaluate: () => ({ allowed: false, reason: 'paused', blockType: 'soft' }) };
    const gov = new GovernanceManager([rule]);
    const scheduler = new Scheduler(graph, new MockDispatcher(), {}, gov);

    const result = await scheduler.run();
    assert.strictEqual(result.success, false);
    assert.strictEqual(graph.getNode('n1').state, 'BLOCKED');
    
    const logs = gov.getAuditLogs();
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].decision, 'pause');
  });
});
