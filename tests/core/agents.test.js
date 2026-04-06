// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BaseAgent } from '../../src/core/agents/base-agent.js';
import { SwarmEngine } from '../../src/core/agents/swarm-engine.js';

class TestAgent extends BaseAgent {
  constructor(name, options = {}) {
    super(name, options);
    this.executedTasks = [];
  }
  async onExecute(task) {
    this.executedTasks.push(task);
    if (task.shouldFail) throw new Error('Task failed');
    return { result: `Success: ${task.type}`, score: task.score || 0 };
  }
}

describe('BaseAgent', () => {
  it('should initialize and change state', async () => {
    const agent = new TestAgent('Test');
    assert.strictEqual(agent.state, 'idle');
    
    await agent.initialize();
    assert.strictEqual(agent.state, 'ready');
  });

  it('should execute tasks and emit events', async () => {
    const agent = new TestAgent('Test');
    await agent.initialize();
    
    const events = [];
    agent.on('task-start', () => events.push('start'));
    agent.on('task-complete', () => events.push('complete'));
    
    const result = await agent.execute({ type: 'test' });
    assert.strictEqual(result.result, 'Success: test');
    assert.deepStrictEqual(events, ['start', 'complete']);
    assert.strictEqual(agent.state, 'ready');
  });

  it('should handle execution errors', async () => {
    const agent = new TestAgent('Test');
    await agent.initialize();
    
    await assert.rejects(
      () => agent.execute({ shouldFail: true }),
      { message: 'Task failed' }
    );
    assert.strictEqual(agent.state, 'error');
  });
});

describe('SwarmEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SwarmEngine({ healthCheckInterval: 100000 }); // Large interval to not interfere
  });

  it('should create a swarm and register agents', async () => {
    await engine.initialize();
    const agent1 = new TestAgent('A1', { id: 'a1' });
    const agent2 = new TestAgent('A2', { id: 'a2' });
    
    const swarm = engine.createSwarm('s1', [agent1, agent2]);
    assert.strictEqual(swarm.id, 's1');
    assert.strictEqual(swarm.agents.size, 2);
    assert.ok(engine.agents.has('a1'));
    await engine.shutdown();
  });

  it('should execute with hierarchical strategy', async () => {
    await engine.initialize();
    const agent = new TestAgent('A1', { id: 'a1' });
    await agent.initialize();
    engine.createSwarm('s1', [agent], { strategy: 'hierarchical' });
    
    const result = await engine.executeInSwarm('s1', { type: 'h-task' });
    assert.strictEqual(result.result, 'Success: h-task');
    await engine.shutdown();
  });

  it('should execute with broadcast strategy', async () => {
    await engine.initialize();
    const agent1 = new TestAgent('A1', { id: 'a1' });
    const agent2 = new TestAgent('A2', { id: 'a2' });
    await agent1.initialize();
    await agent2.initialize();
    engine.createSwarm('s1', [agent1, agent2], { strategy: 'broadcast' });
    
    const results = await engine.executeInSwarm('s1', { type: 'b-task' });
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].result.result, 'Success: b-task');
    await engine.shutdown();
  });

  it('should handle unhealthy agents', async () => {
    await engine.initialize();
    const agent = new TestAgent('A1', { id: 'a1' });
    engine.createSwarm('s1', [agent]);
    
    engine.handleUnhealthyAgent('a1');
    assert.strictEqual(engine.agents.get('a1').status, 'unhealthy');
    await engine.shutdown();
  });
});
