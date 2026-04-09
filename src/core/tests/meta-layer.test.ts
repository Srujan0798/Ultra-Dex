// Copyright (c) 2026 Ultra-Dex
// Tests for Token Guard and Agent Mesh

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Token Guard ─────────────────────────────────────────────────────────────

import {
  BudgetManager,
  ResponseCache,
  CostTracker,
  TokenGuard,
} from '../optimization/token-guard.js';

describe('BudgetManager', () => {
  it('should enforce global budget', () => {
    const bm = new BudgetManager({ globalBudget: 1.0 });
    const r1 = bm.record(0.5);
    assert.equal(r1.allowed, true);
    const r2 = bm.record(0.6); // would exceed 1.0
    assert.equal(r2.allowed, false);
    assert.ok(r2.reason.includes('Global budget exceeded'));
  });

  it('should enforce agent budget', () => {
    const bm = new BudgetManager({ globalBudget: 100 });
    bm.setBudget('agent', 'agent-a', 0.5);
    bm.record(0.3, { agentId: 'agent-a' });
    const r = bm.record(0.3, { agentId: 'agent-a' });
    assert.equal(r.allowed, false);
  });

  it('should track spending per agent', () => {
    const bm = new BudgetManager({ globalBudget: 100 });
    bm.record(0.1, { agentId: 'a1' });
    bm.record(0.2, { agentId: 'a2' });
    const spending = bm.getAllSpending();
    assert.equal(spending.agents['a1'].spent, 0.1);
    assert.equal(spending.agents['a2'].spent, 0.2);
    assert.ok(spending.global.spent > 0.29);
  });

  it('should fire alert callback', () => {
    let alerted = false;
    const bm = new BudgetManager({
      globalBudget: 1.0,
      alertThreshold: 0.5,
      onAlert: () => {
        alerted = true;
      },
    });
    bm.record(0.6);
    assert.equal(alerted, true);
  });
});

describe('ResponseCache', () => {
  it('should cache and return results', () => {
    const cache = new ResponseCache({ ttlMs: 5000 });
    cache.set('gpt-4o', [{ role: 'user', content: 'hi' }], { content: 'hello' });
    const result = cache.get('gpt-4o', [{ role: 'user', content: 'hi' }]);
    assert.deepEqual(result, { content: 'hello' });
  });

  it('should miss on different messages', () => {
    const cache = new ResponseCache();
    cache.set('gpt-4o', [{ role: 'user', content: 'hi' }], { content: 'hello' });
    const result = cache.get('gpt-4o', [{ role: 'user', content: 'bye' }]);
    assert.equal(result, null);
  });

  it('should evict when full', () => {
    const cache = new ResponseCache({ maxSize: 2 });
    cache.set('m', [{ c: '1' }], { content: '1' });
    cache.set('m', [{ c: '2' }], { content: '2' });
    cache.set('m', [{ c: '3' }], { content: '3' }); // triggers eviction
    assert.equal(cache.cache.size, 2);
    assert.equal(cache.getStats().evictions, 1);
  });

  it('should track hit rate', () => {
    const cache = new ResponseCache();
    cache.set('m', [{ c: 'q' }], { content: 'a' });
    cache.get('m', [{ c: 'q' }]); // hit
    cache.get('m', [{ c: 'x' }]); // miss
    const stats = cache.getStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
    assert.equal(stats.hitRate, 50);
  });
});

describe('CostTracker', () => {
  it('should track costs per agent and model', () => {
    const ct = new CostTracker();
    ct.record({
      agentId: 'a1',
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      costPerToken: 0.00001,
    });
    ct.record({
      agentId: 'a2',
      model: 'claude',
      promptTokens: 200,
      completionTokens: 100,
      costPerToken: 0.000005,
    });

    const a1 = ct.getByAgent('a1');
    assert.equal(a1.totalTokens, 150);
    assert.equal(a1.requestCount, 1);

    const summary = ct.getSummary();
    assert.equal(summary.totalRequests, 2);
    assert.ok(summary.totalCost > 0);
  });

  it('should forecast burn rate', () => {
    const ct = new CostTracker();
    // Add some records with recent timestamps
    for (let i = 0; i < 10; i++) {
      ct.record({
        agentId: 'a1',
        model: 'gpt-4o',
        promptTokens: 100,
        completionTokens: 50,
        costPerToken: 0.00001,
      });
    }
    const forecast = ct.forecast();
    assert.ok(forecast.burnRatePerHour >= 0);
    assert.ok(forecast.projectedDailyCost >= 0);
  });
});

describe('TokenGuard', () => {
  it('should cache LLM calls', async () => {
    const guard = new TokenGuard({ globalBudget: 100 });
    const msgs = [{ role: 'user', content: 'hello' }];
    let callCount = 0;

    const callFn = async () => {
      callCount++;
      return { content: 'world', usage: { promptTokens: 10, completionTokens: 20 } };
    };

    const r1 = await guard.guard({ agentId: 'a1', model: 'gpt-4o', messages: msgs }, callFn);
    assert.equal(r1.cached, false);
    assert.equal(callCount, 1);

    const r2 = await guard.guard({ agentId: 'a1', model: 'gpt-4o', messages: msgs }, callFn);
    assert.equal(r2.cached, true);
    assert.equal(callCount, 1); // not called again
  });

  it('should block when budget exceeded', async () => {
    const guard = new TokenGuard({ globalBudget: 0.0001 });
    const msgs = [{ role: 'user', content: 'a very long message '.repeat(100) }];

    await assert.rejects(
      () =>
        guard.guard({ agentId: 'a1', model: 'gpt-4o', messages: msgs }, async () => ({
          content: '...',
        })),
      /TokenGuard/
    );
  });

  it('should suggest cheaper models', () => {
    const guard = new TokenGuard();
    const suggestion = guard.suggestModel('simple-qa', 'gpt-4o');
    assert.equal(suggestion.suggested, 'gemini-2.0-flash');
    assert.ok(suggestion.percentSavings > 0);
  });

  it('should return dashboard data', async () => {
    const guard = new TokenGuard({ globalBudget: 100 });
    await guard.guard(
      { agentId: 'a1', model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      async () => ({ content: 'ok', usage: { promptTokens: 5, completionTokens: 10 } })
    );
    const dashboard = guard.getDashboard();
    assert.ok(dashboard.budget);
    assert.ok(dashboard.cache);
    assert.ok(dashboard.costs);
    assert.ok(dashboard.forecast);
  });
});

// ── Agent Mesh ──────────────────────────────────────────────────────────────

import {
  RoleRegistry,
  TaskQueue,
  MessageBus,
  ConsensusProtocol,
  AgentMesh,
} from '../coordination/agent-mesh.js';

describe('RoleRegistry', () => {
  it('should register and retrieve roles', () => {
    const reg = new RoleRegistry();
    reg.register('coder', { role: 'developer', capabilities: ['code', 'debug'] });
    const role = reg.getRole('coder');
    assert.equal(role.role, 'developer');
    assert.deepEqual(role.capabilities, ['code', 'debug']);
  });

  it('should verify actions against constraints', () => {
    const reg = new RoleRegistry();
    reg.register('reader', { role: 'reader', constraints: ['delete', 'write'] });
    assert.equal(reg.verify('reader', 'read-file').valid, true);
    assert.equal(reg.verify('reader', 'delete-file').valid, false);
  });

  it('should find agents by capability', () => {
    const reg = new RoleRegistry();
    reg.register('a1', { role: 'dev', capabilities: ['code', 'review'] });
    reg.register('a2', { role: 'qa', capabilities: ['test', 'review'] });
    const reviewers = reg.findByCapability('review');
    assert.equal(reviewers.length, 2);
  });
});

describe('TaskQueue', () => {
  it('should distribute tasks by priority', () => {
    const q = new TaskQueue();
    q.add({ id: 'low', description: 'low', priority: 1 });
    q.add({ id: 'high', description: 'high', priority: 10 });
    const task = q.next('a1');
    assert.equal(task.id, 'high');
  });

  it('should respect dependencies', () => {
    const q = new TaskQueue();
    q.add({ id: 'b', description: 'depends on a', priority: 10, dependencies: ['a'] });
    q.add({ id: 'a', description: 'first', priority: 5 });

    const task1 = q.next('a1'); // should get 'a' since 'b' depends on it
    assert.equal(task1.id, 'a');
    q.complete('a');

    const task2 = q.next('a1'); // now 'b' should be available
    assert.equal(task2.id, 'b');
  });

  it('should re-queue failed tasks', () => {
    const q = new TaskQueue();
    q.add({ id: 't1', description: 'task', priority: 5 });
    q.next('a1'); // claim
    q.fail('t1', 'error');
    const retry = q.next('a2'); // should be available again
    assert.equal(retry.id, 't1');
  });
});

describe('MessageBus', () => {
  it('should deliver messages to subscribers', async () => {
    const bus = new MessageBus();
    let received = null;
    bus.subscribe('a1', 'updates', async (payload) => {
      received = payload;
    });

    const result = await bus.send('a2', 'updates', { text: 'hello' });
    assert.equal(result.delivered, 1);
    assert.deepEqual(received, { text: 'hello' });
  });

  it('should track delivery count', async () => {
    const bus = new MessageBus();
    bus.subscribe('a1', 'news', async () => {});
    bus.subscribe('a2', 'news', async () => {});

    const result = await bus.send('sender', 'news', { data: 1 });
    assert.equal(result.delivered, 2);
    assert.equal(result.total, 2);
  });
});

describe('ConsensusProtocol', () => {
  it('should reach consensus when agents agree', async () => {
    const cp = new ConsensusProtocol({ requiredAgreement: 0.66 });
    const result = await cp.check([async () => 'yes', async () => 'yes', async () => 'no']);
    assert.equal(result.consensus, true);
    assert.equal(result.result, 'yes');
  });

  it('should fail consensus when agents disagree', async () => {
    const cp = new ConsensusProtocol({ requiredAgreement: 0.66 });
    const result = await cp.check([async () => 'a', async () => 'b', async () => 'c']);
    assert.equal(result.consensus, false);
  });

  it('should handle agent failures gracefully', async () => {
    const cp = new ConsensusProtocol({ requiredAgreement: 0.5 });
    const result = await cp.check([
      async () => 'ok',
      async () => {
        throw new Error('fail');
      },
    ]);
    assert.equal(result.consensus, true);
    assert.equal(result.result, 'ok');
  });
});

describe('AgentMesh', () => {
  it('should register agents and claim tasks', () => {
    const mesh = new AgentMesh();
    mesh.registerAgent('coder', { role: 'developer', capabilities: ['code'] });
    mesh.submitTask({
      id: 't1',
      description: 'Write code',
      priority: 5,
      requiredCapability: 'code',
    });
    const task = mesh.claimTask('coder');
    assert.equal(task.id, 't1');
  });

  it('should return null when no matching tasks', () => {
    const mesh = new AgentMesh();
    mesh.registerAgent('tester', { role: 'qa', capabilities: ['test'] });
    mesh.submitTask({ id: 't1', description: 'Code', requiredCapability: 'code' });
    const task = mesh.claimTask('tester');
    assert.equal(task, null);
  });

  it('should provide dashboard data', () => {
    const mesh = new AgentMesh();
    mesh.registerAgent('a1', { role: 'dev', capabilities: ['code'] });
    mesh.submitTask({ id: 't1', description: 'test', priority: 5 });
    const dashboard = mesh.getDashboard();
    assert.equal(dashboard.agents.length, 1);
    assert.equal(dashboard.tasks.pending, 1);
  });
});
