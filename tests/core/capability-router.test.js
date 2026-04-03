// Copyright (c) 2026 Ultra-Dex
// tests/core/capability-router.test.js

import { test } from 'node:test';
import assert from 'node:assert';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { CapabilityRouter } from '../../src/core/orchestration/capability-router.js';

test('CapabilityRouter', async (t) => {
  let registry;
  let router;

  t.beforeEach(async () => {
    registry = new AgentRegistry();
    await registry.initialize();

    // Register some test agents
    await registry.registerAgent('backend', {
      name: 'Backend Agent',
      description: 'Handles backend tasks',
      capabilities: ['nodejs', 'api', 'database', 'implementation', 'coding'],
    });

    await registry.registerAgent('frontend', {
      name: 'Frontend Agent',
      description: 'Handles frontend tasks',
      capabilities: [
        'ui',
        'component',
        'javascript',
        'css',
        'html',
        'implementation',
        'coding',
        'ui-design',
      ],
    });

    router = new CapabilityRouter(registry, { enableLogging: false });
  });

  await t.test('should route task to matching agent', async () => {
    const result = await router.route({
      task: 'fix provider bug',
      required: ['nodejs', 'api'],
    });

    assert.equal(result.agent, 'backend');
    assert.deepEqual(result.matchedCapabilities.sort(), ['nodejs', 'api'].sort());
    assert(result.capabilities.includes('nodejs'));
    assert(result.capabilities.includes('api'));
  });

  await t.test('should throw error when no agent matches', async () => {
    await assert.rejects(
      async () => {
        await router.route({
          task: 'some task',
          required: ['nonexistent', 'capability'],
        });
      },
      {
        message: /No agent found with required capabilities/,
      }
    );
  });

  await t.test('should validate required capabilities array', async () => {
    await assert.rejects(
      async () => {
        await router.route({
          task: 'some task',
          required: [],
        });
      },
      {
        message: /"required" must be a non-empty array/,
      }
    );

    await assert.rejects(
      async () => {
        await router.route({
          task: 'some task',
          required: 'not-an-array',
        });
      },
      {
        message: /"required" must be a non-empty array/,
      }
    );
  });

  await t.test('should cache routing decisions', async () => {
    // First call
    const result1 = await router.route({
      task: 'task 1',
      required: ['nodejs', 'api'],
    });

    // Second call with same requirements should use cache
    const result2 = await router.route({
      task: 'task 2',
      required: ['nodejs', 'api'],
    });

    assert.deepEqual(result1, result2);
    assert.equal(router.getStats().cacheSize, 1);
  });

  await t.test('should clear cache', async () => {
    await router.route({
      task: 'task',
      required: ['nodejs', 'api'],
    });

    assert.equal(router.getStats().cacheSize, 1);

    router.clearCache();

    assert.equal(router.getStats().cacheSize, 0);
  });

  await t.test('should validate agent capabilities', async () => {
    assert(router.validateAgentCapabilities('backend', ['nodejs', 'api']));
    assert(!router.validateAgentCapabilities('backend', ['nonexistent']));
    assert(!router.validateAgentCapabilities('nonexistent-agent', ['nodejs']));
  });

  await t.test('should get agents with specific capabilities', async () => {
    const agents = router.getAgentsWithCapabilities(['nodejs', 'api']);
    assert.equal(agents.length, 1);
    assert.equal(agents[0].id, 'backend');
  });

  await t.test('should get default capabilities for agent type', async () => {
    const backendCaps = router.getDefaultCapabilities('backend');
    assert(backendCaps.includes('nodejs'));
    assert(backendCaps.includes('api'));

    const nonexistentCaps = router.getDefaultCapabilities('nonexistent');
    assert.deepEqual(nonexistentCaps, []);
  });

  await t.test('should select best agent from multiple matches', async () => {
    // Add another agent with overlapping capabilities
    await registry.registerAgent('fullstack', {
      name: 'Fullstack Agent',
      description: 'Handles both frontend and backend',
      capabilities: ['nodejs', 'api', 'database', 'ui', 'component', 'javascript'],
    });

    const result = await router.route({
      task: 'api task',
      required: ['nodejs', 'api'],
    });

    // Should select the agent with more matching capabilities
    assert(result.agent === 'backend' || result.agent === 'fullstack');
    assert(result.matchedCapabilities.includes('nodejs'));
    assert(result.matchedCapabilities.includes('api'));
  });
});
