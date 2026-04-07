import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';

const activeRegistries = new Set();

async function waitFor(predicate, timeoutMs = 5000, intervalMs = 10) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition was not met within ${timeoutMs}ms`);
}

afterEach(async () => {
  for (const registry of activeRegistries) {
    await registry.shutdown();
  }
  activeRegistries.clear();
});

describe('Mesh communication', () => {
  it('discovers remote agents and removes them when they go offline', async () => {
    const namespace = `mesh-integration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const registryA = new AgentRegistry({
      autoDiscover: false,
      enablePersistence: false,
      enableMesh: true,
      busType: 'memory',
      meshNamespace: namespace,
      meshRefreshIntervalMs: 50,
      meshHeartbeatIntervalMs: 25,
      meshHeartbeatTimeoutMs: 100,
      meshHeartbeatSweepIntervalMs: 25,
    });
    const registryB = new AgentRegistry({
      autoDiscover: false,
      enablePersistence: false,
      enableMesh: true,
      busType: 'memory',
      meshNamespace: namespace,
      meshRefreshIntervalMs: 50,
      meshHeartbeatIntervalMs: 25,
      meshHeartbeatTimeoutMs: 100,
      meshHeartbeatSweepIntervalMs: 25,
    });

    activeRegistries.add(registryA);
    activeRegistries.add(registryB);

    await registryA.initialize();
    await registryB.initialize();

    await registryA.registerAgent('mesh-agent-a', {
      name: 'Mesh Agent A',
      description: 'Distributed worker',
      capabilities: ['mesh', 'routing'],
    });

    await waitFor(() => registryB.getMeshAgents().some((agent) => agent.id === 'mesh-agent-a'));

    assert.deepStrictEqual(
      registryB.getMeshAgents().map((agent) => agent.id),
      ['mesh-agent-a']
    );

    await registryA.removeAgent('mesh-agent-a');

    await waitFor(() => registryB.getMeshAgents().every((agent) => agent.id !== 'mesh-agent-a'));
    assert.strictEqual(registryB.getMeshAgents().length, 0);
  });
});
