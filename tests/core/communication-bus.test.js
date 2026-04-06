// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentCommunicationBus } from '../../src/core/orchestration/communication-bus.js';

describe('AgentCommunicationBus', () => {
  let bus;
  let namespace;

  beforeEach(() => {
    namespace = `comm-bus-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    bus = new AgentCommunicationBus({ namespace, mesh: true, busType: 'memory' });
  });

  it('should initialize and connect', async () => {
    await bus.initialize();
    assert.strictEqual(bus.isConnected, true);
  });

  it('should subscribe to a channel and receive messages', async () => {
    await bus.initialize();
    let received = null;
    bus.subscribe('test-channel', (envelope) => {
      received = envelope;
    });

    const msg = { data: 'hello' };
    await bus.publish('test-channel', msg);

    assert.ok(received);
    assert.strictEqual(received.channel, 'test-channel');
    assert.deepStrictEqual(received.message, msg);
  });

  it('should unsubscribe from a channel', async () => {
    await bus.initialize();
    let count = 0;
    const handler = () => count++;
    const unsubscribe = bus.subscribe('test-channel', handler);

    await bus.publish('test-channel', 'msg1');
    assert.strictEqual(count, 1);

    unsubscribe();
    await bus.publish('test-channel', 'msg2');
    assert.strictEqual(count, 1);
  });

  it('should track message history', async () => {
    await bus.initialize();
    await bus.publish('ch1', 'm1');
    await bus.publish('ch1', 'm2');
    await bus.publish('ch2', 'm3');

    const history = bus.getChannelHistory('ch1');
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].message, 'm1');
    assert.strictEqual(history[1].message, 'm2');
  });

  it('should return subscriber count', async () => {
    await bus.initialize();
    bus.subscribe('ch', () => {});
    bus.subscribe('ch', () => {});
    assert.strictEqual(bus.getSubscriberCount('ch'), 2);
  });

  it('should throw if publishing while not connected', async () => {
    await assert.rejects(
      () => bus.publish('ch', 'msg'),
      { message: 'Communication bus is not connected' }
    );
  });

  it('should handle subscriber errors gracefully', async () => {
    await bus.initialize();
    bus.subscribe('ch', () => { throw new Error('Subscriber failed'); });
    
    // This should not throw
    const msgId = await bus.publish('ch', 'msg');
    assert.ok(msgId);
  });

  it('discovers agents across the mesh', async () => {
    await bus.initialize();

    const remoteBus = new AgentCommunicationBus({
      namespace,
      mesh: true,
      busType: 'memory',
      nodeId: 'remote-node',
    });
    await remoteBus.initialize();

    await remoteBus.publish('agent.online', {
      id: 'backend',
      name: 'Backend Agent',
      capabilities: ['api', 'database'],
      status: 'active',
      nodeId: 'remote-node',
    });

    const discovered = bus.discoverAgents();
    assert.strictEqual(discovered.length, 1);
    assert.strictEqual(discovered[0].id, 'backend');
    assert.deepStrictEqual(discovered[0].capabilities, ['api', 'database']);

    await remoteBus.shutdown();
  });

  it('routes tasks directly to an agent channel', async () => {
    await bus.initialize();

    const workerBus = new AgentCommunicationBus({
      namespace,
      mesh: true,
      busType: 'memory',
      nodeId: 'worker-node',
    });
    await workerBus.initialize();

    let routedTask = null;
    workerBus.subscribe('agent.worker-1.task', (envelope) => {
      routedTask = envelope.message.task;
    });

    const route = await bus.routeTask({ id: 'task-1', objective: 'Ship fix' }, 'worker-1');
    assert.strictEqual(route.agentId, 'worker-1');
    assert.strictEqual(route.channel, 'agent.worker-1.task');
    assert.deepStrictEqual(routedTask, { id: 'task-1', objective: 'Ship fix' });

    await workerBus.shutdown();
  });
});
