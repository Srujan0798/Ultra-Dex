import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RuleEngine,
  RequireTests,
  RequireApproval,
  CostBudget,
  ConfidenceThreshold,
} from '../../governance/rules.js';
import { GovernanceManager, ExecutionBlockedError } from '../../governance/governance-manager.js';
import { evaluateRules, applyRule } from '../../governance/decisions.js';
import { GraphNode } from '../../dexgraph/types.js';
import { ExecutionContext } from '../../adapters/executionAdapter.js';

function makeNode(id: string, role: GraphNode['role'] = 'engineer'): GraphNode {
  return {
    id, role, instruction: 'test', dependencies: [],
    context: {}, parallel: false, state: 'READY',
  };
}

function makeCtx(overrides: Partial<ExecutionContext['input']> = {}): ExecutionContext {
  return {
    nodeId: 'n1', taskType: 'engineer',
    input: { ...overrides },
    timeout: 30000,
  };
}

describe('RuleEngine', () => {
  it('allows when no rules', () => {
    const engine = new RuleEngine();
    const d = engine.evaluate(makeNode('n1'), makeCtx());
    assert.strictEqual(d.allowed, true);
  });

  it('allows when all rules pass', () => {
    const engine = new RuleEngine();
    engine.addRule(new RequireTests(['deployer']));
    const d = engine.evaluate(makeNode('n1', 'engineer'), makeCtx());
    assert.strictEqual(d.allowed, true);
  });

  it('blocks when first rule fails', () => {
    const engine = new RuleEngine();
    engine.addRule(new RequireTests(['engineer']));
    engine.addRule(new CostBudget(100));
    const d = engine.evaluate(makeNode('n1', 'engineer'), makeCtx({ testsPassed: false }));
    assert.strictEqual(d.allowed, false);
    assert.ok(d.reason.includes('test') || d.reason.includes('Test'));
  });

  it('rules are evaluated in order — short-circuits on first block', () => {
    const calls: string[] = [];
    const engine = new RuleEngine();
    engine.addRule({
      name: 'first',
      evaluate: (_n, _c) => { calls.push('first'); return { allowed: false, reason: 'stop', blockType: 'hard' }; },
    });
    engine.addRule({
      name: 'second',
      evaluate: (_n, _c) => { calls.push('second'); return { allowed: true, reason: 'ok' }; },
    });
    engine.evaluate(makeNode('n1'), makeCtx());
    assert.deepStrictEqual(calls, ['first']);
  });
});

describe('RequireTests rule', () => {
  it('blocks when testsPassed !== true for matching role', () => {
    const rule = new RequireTests(['deployer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx());
    // engineer is not a deployer, should allow
    assert.strictEqual(d.allowed, true);
  });

  it('blocks deployer when testsPassed missing', () => {
    const rule = new RequireTests(['engineer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx());
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.blockType, 'hard');
  });

  it('allows deployer when testsPassed is true', () => {
    const rule = new RequireTests(['engineer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx({ testsPassed: true }));
    assert.strictEqual(d.allowed, true);
  });
});

describe('RequireApproval rule', () => {
  it('blocks when approved !== true for matching role', () => {
    const rule = new RequireApproval(['engineer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx({ approved: false }));
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.blockType, 'soft');
  });

  it('allows when approved is true', () => {
    const rule = new RequireApproval(['engineer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx({ approved: true }));
    assert.strictEqual(d.allowed, true);
  });

  it('allows non-matching role regardless of approval', () => {
    const rule = new RequireApproval(['deployer']);
    const d = rule.evaluate(makeNode('n1', 'engineer'), makeCtx());
    assert.strictEqual(d.allowed, true);
  });
});

describe('CostBudget rule', () => {
  it('allows when cost is within budget', () => {
    const rule = new CostBudget(100);
    const d = rule.evaluate(makeNode('n1'), makeCtx({ totalCostUSD: 50 }));
    assert.strictEqual(d.allowed, true);
  });

  it('blocks when cost exceeds budget', () => {
    const rule = new CostBudget(50);
    const d = rule.evaluate(makeNode('n1'), makeCtx({ totalCostUSD: 51 }));
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.blockType, 'soft');
  });

  it('allows when cost equals budget exactly', () => {
    const rule = new CostBudget(100);
    const d = rule.evaluate(makeNode('n1'), makeCtx({ totalCostUSD: 100 }));
    assert.strictEqual(d.allowed, true);
  });

  it('allows when totalCostUSD is absent (defaults to 0)', () => {
    const rule = new CostBudget(10);
    const d = rule.evaluate(makeNode('n1'), makeCtx());
    assert.strictEqual(d.allowed, true);
  });
});

describe('ConfidenceThreshold rule', () => {
  it('allows when confidence is above threshold', () => {
    const rule = new ConfidenceThreshold(0.7);
    const d = rule.evaluate(makeNode('n1'), makeCtx({ averageConfidence: 0.9 }));
    assert.strictEqual(d.allowed, true);
  });

  it('blocks when confidence is below threshold', () => {
    const rule = new ConfidenceThreshold(0.8);
    const d = rule.evaluate(makeNode('n1'), makeCtx({ averageConfidence: 0.5 }));
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.blockType, 'hard');
  });

  it('allows when confidence is missing (no prior data)', () => {
    const rule = new ConfidenceThreshold(0.8);
    const d = rule.evaluate(makeNode('n1'), makeCtx());
    assert.strictEqual(d.allowed, true);
  });
});

describe('GovernanceManager', () => {
  it('returns allow decision when no rules', () => {
    const gm = new GovernanceManager();
    const d = gm.evaluate(makeNode('n1'), makeCtx());
    assert.strictEqual(d.type, 'allow');
  });

  it('returns block decision for hard block rule', () => {
    const gm = new GovernanceManager([new RequireTests(['engineer'])]);
    const d = gm.evaluate(makeNode('n1', 'engineer'), makeCtx({ testsPassed: false }));
    assert.strictEqual(d.type, 'block');
  });

  it('returns pause decision for soft block rule', () => {
    const gm = new GovernanceManager([new CostBudget(0)]);
    const d = gm.evaluate(makeNode('n1'), makeCtx({ totalCostUSD: 100 }));
    assert.strictEqual(d.type, 'pause');
  });

  it('records audit logs for every evaluation', () => {
    const gm = new GovernanceManager([new RequireTests(['engineer'])]);
    gm.evaluate(makeNode('n1', 'engineer'), makeCtx());
    gm.evaluate(makeNode('n2', 'engineer'), makeCtx({ testsPassed: true }));
    const logs = gm.getAuditLogs();
    assert.strictEqual(logs.length, 2);
    assert.ok(logs[0].timestamp);
    assert.strictEqual(logs[0].node, 'n1');
    assert.strictEqual(logs[1].node, 'n2');
  });

  it('audit log captures reason', () => {
    const gm = new GovernanceManager([new CostBudget(10)]);
    gm.evaluate(makeNode('n1'), makeCtx({ totalCostUSD: 50 }));
    const logs = gm.getAuditLogs();
    assert.ok(logs[0].reason.length > 0);
  });
});

describe('decisions.applyRule / evaluateRules', () => {
  it('applyRule returns allow for passing rule', () => {
    const d = applyRule(new CostBudget(100), makeNode('n1'), makeCtx({ totalCostUSD: 50 }));
    assert.strictEqual(d.type, 'allow');
  });

  it('applyRule returns block for hard block', () => {
    const d = applyRule(new RequireTests(['engineer']), makeNode('n1', 'engineer'), makeCtx());
    assert.strictEqual(d.type, 'block');
  });

  it('applyRule returns pause for soft block', () => {
    const d = applyRule(new CostBudget(0), makeNode('n1'), makeCtx({ totalCostUSD: 1 }));
    assert.strictEqual(d.type, 'pause');
  });

  it('evaluateRules returns first non-allow decision', () => {
    const rules = [new CostBudget(100), new RequireTests(['engineer'])];
    const d = evaluateRules(rules, makeNode('n1', 'engineer'), makeCtx({ testsPassed: false }));
    assert.strictEqual(d.type, 'block');
  });

  it('evaluateRules returns allow when all pass', () => {
    const rules = [new CostBudget(100), new RequireTests(['engineer'])];
    const d = evaluateRules(rules, makeNode('n1', 'engineer'), makeCtx({ testsPassed: true }));
    assert.strictEqual(d.type, 'allow');
  });
});

describe('ExecutionBlockedError', () => {
  it('is an instanceof Error', () => {
    const e = new ExecutionBlockedError('blocked');
    assert.ok(e instanceof Error);
    assert.strictEqual(e.name, 'ExecutionBlockedError');
    assert.strictEqual(e.message, 'blocked');
  });
});
