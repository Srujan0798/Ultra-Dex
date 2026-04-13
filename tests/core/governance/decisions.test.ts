import { test } from 'node:test';
import * as assert from 'node:assert';
import { evaluateRules, Decision } from '../../../governance/decisions.js';
import { Rule, RuleDecision } from '../../../governance/types.js';
import { GraphNode } from '../../../dexgraph/types.js';
import { ExecutionContext } from '../../../adapters/executionAdapter.js';

function createNode(): GraphNode {
  return {
    id: 'n1', role: 'engineer', instruction: 'test', dependencies: [], context: {}, parallel: false, state: 'READY'
  };
}

const mockCtx: ExecutionContext = { nodeId: 'n1', taskType: 't', input: {}, timeout: 100 };

test('Decisions', async (t) => {
  await t.test('allow if no rules fail', () => {
    const rules: Rule[] = [
      { name: 'r1', evaluate: () => ({ allowed: true, reason: 'ok' }) }
    ];
    const node = createNode();
    const decision = evaluateRules(rules, node, mockCtx);
    
    assert.strictEqual(decision.type, 'allow');
    assert.strictEqual(decision.node, node);
  });

  await t.test('block if hard rule fails', () => {
    const rules: Rule[] = [
      { name: 'r1', evaluate: () => ({ allowed: true, reason: 'ok' }) },
      { name: 'r2', evaluate: () => ({ allowed: false, reason: 'fail', blockType: 'hard' }) }
    ];
    const node = createNode();
    const decision = evaluateRules(rules, node, mockCtx);
    
    assert.strictEqual(decision.type, 'block');
    assert.strictEqual(decision.reason, 'fail');
  });

  await t.test('pause if soft rule fails', () => {
    const rules: Rule[] = [
      { name: 'r1', evaluate: () => ({ allowed: false, reason: 'soft fail', blockType: 'soft' }) }
    ];
    const node = createNode();
    const decision = evaluateRules(rules, node, mockCtx);
    
    assert.strictEqual(decision.type, 'pause');
    assert.strictEqual(decision.reason, 'soft fail');
  });

  await t.test('returns first failure', () => {
    const rules: Rule[] = [
      { name: 'r1', evaluate: () => ({ allowed: false, reason: 'fail1', blockType: 'soft' }) },
      { name: 'r2', evaluate: () => ({ allowed: false, reason: 'fail2', blockType: 'hard' }) }
    ];
    const node = createNode();
    const decision = evaluateRules(rules, node, mockCtx);
    
    assert.strictEqual(decision.type, 'pause');
    assert.strictEqual(decision.reason, 'fail1');
  });
});
