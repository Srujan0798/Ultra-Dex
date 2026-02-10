// Copyright (c) 2026 Ultra-Dex

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { P2PNode, DecentralizedSwarm } from '../lib/swarm/p2p.js';

describe('P2P Swarm v5.1', () => {
  describe('P2PNode', () => {
    it('should create a P2P node', () => {
      const node = new P2PNode('test-agent');
      assert.strictEqual(node.id, 'test-agent');
      assert.strictEqual(node.peers.size, 0);
      assert.strictEqual(node.isRunning, false);
    });

    it('should start and stop', async () => {
      const node = new P2PNode('test-agent');

      await node.start();
      assert.strictEqual(node.isRunning, true);

      await node.stop();
      assert.strictEqual(node.isRunning, false);
    });

    it('should connect to peers', async () => {
      const node = new P2PNode('agent-1');
      await node.start();

      node.connect('agent-2', { type: 'test' });
      assert.strictEqual(node.peers.size, 1);
      assert.strictEqual(node.peers.has('agent-2'), true);

      await node.stop();
    });

    it('should disconnect from peers', async () => {
      const node = new P2PNode('agent-1');
      await node.start();

      node.connect('agent-2', { type: 'test' });
      node.disconnect('agent-2');
      assert.strictEqual(node.peers.size, 0);

      await node.stop();
    });

    it('should publish and receive messages', async () => {
      const node = new P2PNode('agent-1');
      await node.start();

      const received = [];
      node.subscribe('test-topic', (msg) => {
        received.push(msg);
      });

      await node.publish('test-topic', { data: 'hello' });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      assert.strictEqual(received.length, 1);
      assert.deepStrictEqual(received[0], { data: 'hello' });

      await node.stop();
    });

    it('should track message log', async () => {
      const node = new P2PNode('agent-1');
      await node.start();

      const msgId = await node.publish('test-topic', { data: 'test' });
      assert.strictEqual(node.messageLog.has(msgId), true);

      await node.stop();
    });

    it('should get stats', async () => {
      const node = new P2PNode('agent-1');
      await node.start();

      node.connect('agent-2', { type: 'test' });
      node.subscribe('topic', () => {});
      await node.publish('topic', { data: 'test' });

      const stats = node.getStats();
      assert.strictEqual(stats.peers, 1);
      assert.strictEqual(stats.topics, 1);
      assert.strictEqual(stats.messages, 1);

      await node.stop();
    });
  });

  describe('DecentralizedSwarm', () => {
    it('should create a decentralized swarm', () => {
      const swarm = new DecentralizedSwarm('test-swarm');
      assert.strictEqual(swarm.id, 'test-swarm');
      assert.strictEqual(swarm.nodes.size, 0);
    });

    it('should add and remove agents', async () => {
      const swarm = new DecentralizedSwarm('test-swarm');

      await swarm.addAgent('agent-1');
      assert.strictEqual(swarm.nodes.size, 1);

      await swarm.removeAgent('agent-1');
      assert.strictEqual(swarm.nodes.size, 0);
    });

    it('should connect agents', async () => {
      const swarm = new DecentralizedSwarm('test-swarm');

      await swarm.addAgent('agent-1');
      await swarm.addAgent('agent-2');

      swarm.connectAgents('agent-1', 'agent-2');

      const node1 = swarm.nodes.get('agent-1');
      const node2 = swarm.nodes.get('agent-2');

      assert.strictEqual(node1.peers.has('agent-2'), true);
      assert.strictEqual(node2.peers.has('agent-1'), true);

      await swarm.shutdown();
    });

    it('should broadcast tasks', async () => {
      const swarm = new DecentralizedSwarm('test-swarm');

      await swarm.addAgent('agent-1');
      await swarm.addAgent('agent-2');

      const received1 = [];
      const received2 = [];

      swarm.nodes.get('agent-1').subscribe('tasks', (msg) => received1.push(msg));
      swarm.nodes.get('agent-2').subscribe('tasks', (msg) => received2.push(msg));

      await swarm.broadcastTask({ type: 'test' }, 'tasks');

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Each node receives its own published message
      assert.strictEqual(received1.length >= 1, true);
      assert.strictEqual(received2.length >= 1, true);

      await swarm.shutdown();
    });

    it('should get topology', async () => {
      const swarm = new DecentralizedSwarm('test-swarm');

      await swarm.addAgent('agent-1');
      await swarm.addAgent('agent-2');
      swarm.connectAgents('agent-1', 'agent-2');

      const topology = swarm.getTopology();
      assert.strictEqual(topology.id, 'test-swarm');
      assert.strictEqual(topology.agents.length, 2);
      assert.strictEqual(topology.connections.length, 2); // bidirectional

      await swarm.shutdown();
    });

    it('should shutdown gracefully', async () => {
      const swarm = new DecentralizedSwarm('test-swarm');

      await swarm.addAgent('agent-1');
      await swarm.addAgent('agent-2');

      await swarm.shutdown();
      assert.strictEqual(swarm.nodes.size, 0);
    });
  });
});
