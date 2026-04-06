// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentCommunicationBus } from '../../src/core/orchestration/communication-bus.js';

describe('AgentCommunicationBus', () => {
  let bus;

  beforeEach(() => {
    bus = new AgentCommunicationBus();
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
});
