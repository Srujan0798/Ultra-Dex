import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RuleEngine, RequireTestsRule, CostBudgetRule, ConfidenceThresholdRule } from '../../governance/rulesEngine.js';
import { GraphNode } from '../../dexgraph/types.js';

function makeNode(id: string, role: GraphNode['role'] = 'engineer'): GraphNode {
  return { id, role, instruction: 'test', dependencies: [], context: {}, parallel: false, state: 'CREATED' };
}

function makeContext(overrides: Partial<Parameters<RequireTestsRule['evaluate']>[1]> = {}): Parameters<RequireTestsRule['evaluate']>[1] {
  return {
    workflowId: 'wf-1',
    totalCost: { tokens: 0, estimatedUSD: 0 },
    testsPassed: true,
    nodeHistory: {},
    ...overrides,
  };
}

describe('RuleEngine', () => {
  it('allows when all rules pass', () => {
    const engine = new RuleEngine();
    engine.addRule(new RequireTestsRule());
    const result = engine.evaluate(makeNode('A'), makeContext());
    assert.equal(result.allowed, true);
  });

  it('returns first failure', () => {
    const engine = new RuleEngine();
    engine.addRule(new RequireTestsRule());
    engine.addRule(new CostBudgetRule(10));
    const result = engine.evaluate(makeNode('A'), makeContext({ totalCost: { tokens: 0, estimatedUSD: 50 } }));
    assert.equal(result.allowed, false);
    assert.ok(result.reason.includes('budget'));
  });

  it('empty rule engine always allows', () => {
    const engine = new RuleEngine();
    const result = engine.evaluate(makeNode('A'), makeContext());
    assert.equal(result.allowed, true);
  });
});

describe('RequireTestsRule', () => {
  it('blocks when tests not passed for tester role', () => {
    const rule = new RequireTestsRule();
    const result = rule.evaluate(makeNode('A', 'tester'), makeContext({ testsPassed: false }));
    assert.equal(result.allowed, false);
    assert.ok(result.reason.includes('Tests'));
  });

  it('allows when tests passed for tester role', () => {
    const rule = new RequireTestsRule();
    const result = rule.evaluate(makeNode('A', 'tester'), makeContext({ testsPassed: true }));
    assert.equal(result.allowed, true);
  });

  it('allows non-tester roles regardless', () => {
    const rule = new RequireTestsRule();
    const result = rule.evaluate(makeNode('A', 'engineer'), makeContext({ testsPassed: false }));
    assert.equal(result.allowed, true);
  });
});

describe('CostBudgetRule', () => {
  it('blocks when budget exceeded', () => {
    const rule = new CostBudgetRule(10);
    const result = rule.evaluate(makeNode('A'), makeContext({ totalCost: { tokens: 0, estimatedUSD: 50 } }));
    assert.equal(result.allowed, false);
  });

  it('allows when within budget', () => {
    const rule = new CostBudgetRule(100);
    const result = rule.evaluate(makeNode('A'), makeContext({ totalCost: { tokens: 0, estimatedUSD: 5 } }));
    assert.equal(result.allowed, true);
  });
});

describe('ConfidenceThresholdRule', () => {
  it('blocks when confidence low', () => {
    const rule = new ConfidenceThresholdRule(0.7);
    const result = rule.evaluate(makeNode('A'), makeContext({ nodeHistory: { A: { confidence: 0.3 } } }));
    assert.equal(result.allowed, false);
  });

  it('allows when confidence OK', () => {
    const rule = new ConfidenceThresholdRule(0.7);
    const result = rule.evaluate(makeNode('A'), makeContext({ nodeHistory: { A: { confidence: 0.9 } } }));
    assert.equal(result.allowed, true);
  });

  it('allows when no history', () => {
    const rule = new ConfidenceThresholdRule(0.7);
    const result = rule.evaluate(makeNode('A'), makeContext());
    assert.equal(result.allowed, true);
  });
});
