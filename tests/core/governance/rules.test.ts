import { test } from 'node:test';
import * as assert from 'node:assert';
import { RuleEngine, RequireTests, RequireApproval, CostBudget, ConfidenceThreshold } from '../../../governance/rules.js';
import { GraphNode } from '../../../dexgraph/types.js';
import { ExecutionContext } from '../../../adapters/executionAdapter.js';

function createNode(role: string): GraphNode {
  return {
    id: 'n1', role: role as any, instruction: 'test', dependencies: [], context: {}, parallel: false, state: 'READY'
  };
}

test('RuleEngine and Rules', async (t) => {
  await t.test('RequireTests rule', () => {
    const rule = new RequireTests(['deployer']);
    
    // Pass case
    const node1 = createNode('deployer');
    const ctx1: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { testsPassed: true }, timeout: 100 };
    assert.strictEqual(rule.evaluate(node1, ctx1).allowed, true);

    // Fail case
    const ctx2: ExecutionContext = { nodeId: 'n1', taskType: 't', input: {}, timeout: 100 };
    const decision = rule.evaluate(node1, ctx2);
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.blockType, 'hard');

    // Ignore case (wrong role)
    const node2 = createNode('engineer');
    assert.strictEqual(rule.evaluate(node2, ctx2).allowed, true);
  });

  await t.test('RequireApproval rule', () => {
    const rule = new RequireApproval(['deployer']);
    const node = createNode('deployer');
    
    // Fail case
    const ctx1: ExecutionContext = { nodeId: 'n1', taskType: 't', input: {}, timeout: 100 };
    const dec1 = rule.evaluate(node, ctx1);
    assert.strictEqual(dec1.allowed, false);
    assert.strictEqual(dec1.blockType, 'soft');

    // Pass case
    const ctx2: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { approved: true }, timeout: 100 };
    assert.strictEqual(rule.evaluate(node, ctx2).allowed, true);
  });

  await t.test('CostBudget rule', () => {
    const rule = new CostBudget(10);
    const node = createNode('engineer');
    
    // Pass
    const ctx1: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { totalCostUSD: 5 }, timeout: 100 };
    assert.strictEqual(rule.evaluate(node, ctx1).allowed, true);

    // Fail
    const ctx2: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { totalCostUSD: 15 }, timeout: 100 };
    const dec = rule.evaluate(node, ctx2);
    assert.strictEqual(dec.allowed, false);
    assert.strictEqual(dec.blockType, 'soft');
  });

  await t.test('ConfidenceThreshold rule', () => {
    const rule = new ConfidenceThreshold(0.8);
    const node = createNode('engineer');
    
    // Pass
    const ctx1: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { averageConfidence: 0.9 }, timeout: 100 };
    assert.strictEqual(rule.evaluate(node, ctx1).allowed, true);

    // Fail
    const ctx2: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { averageConfidence: 0.7 }, timeout: 100 };
    const dec = rule.evaluate(node, ctx2);
    assert.strictEqual(dec.allowed, false);
    assert.strictEqual(dec.blockType, 'hard');

    // Undefined passes (not available yet)
    const ctx3: ExecutionContext = { nodeId: 'n1', taskType: 't', input: {}, timeout: 100 };
    assert.strictEqual(rule.evaluate(node, ctx3).allowed, true);
  });

  await t.test('RuleEngine composability', () => {
    const engine = new RuleEngine();
    engine.addRule(new CostBudget(10));
    engine.addRule(new RequireTests(['deployer']));

    const node = createNode('deployer');
    const ctx: ExecutionContext = { nodeId: 'n1', taskType: 't', input: { totalCostUSD: 5, testsPassed: false }, timeout: 100 };
    
    // Should fail RequireTests even though CostBudget passes
    const dec = engine.evaluate(node, ctx);
    assert.strictEqual(dec.allowed, false);
    assert.strictEqual(dec.blockType, 'hard');
  });
});
