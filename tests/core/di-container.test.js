import "reflect-metadata";
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { AIMetaLayer, aiMetaLayer } from '../../src/core/ai/ai-meta-layer.js';
import { container, createSessionContainer } from '../../src/core/di/container.js';
import { DI_TOKENS } from '../../src/core/di/tokens.js';
import { MemoryManager, ppmManager } from '../../src/core/memory/manager.js';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';

function createMockMemory(id) {
  return {
    id,
    init: async () => {},
    initialize: async () => {},
    search: async () => [],
    add: async () => ({}),
    stats: async () => ({ id }),
  };
}

function createMockRegistry(id) {
  return {
    id,
    initialize: async () => {},
    getAgentPrompt: async () => `Prompt for ${id}`,
    findAgentsByCapabilities: () => [],
    getMetrics: () => ({ id }),
  };
}

function createMockTelemetry(id) {
  return {
    id,
    initialize: async () => {},
    trackMetric: async () => {},
  };
}

describe('core DI container', () => {
  test('resolves root singletons through the container', () => {
    assert.strictEqual(container.resolve(MemoryManager), ppmManager);
    assert.strictEqual(container.resolve(AIMetaLayer), aiMetaLayer);
  });

  test('injects mocked dependencies through registerInstance()', () => {
    const sessionContainer = createSessionContainer('session-di');
    const memory = createMockMemory('memory-session-di');
    const registry = createMockRegistry('registry-session-di');
    const ai = { call: async () => ({ text: 'ok' }) };
    const telemetry = createMockTelemetry('telemetry-session-di');

    sessionContainer.registerInstance(DI_TOKENS.memoryManager, memory);
    sessionContainer.registerInstance(DI_TOKENS.agentRegistry, registry);
    sessionContainer.registerInstance(DI_TOKENS.aiMetaLayer, ai);
    sessionContainer.registerInstance(DI_TOKENS.telemetryService, telemetry);

    const orchestrator = sessionContainer.resolve(AgentOrchestrator);

    assert.strictEqual(orchestrator.sessionId, 'session-di');
    assert.strictEqual(orchestrator.memory, memory);
    assert.strictEqual(orchestrator.registry, registry);
    assert.strictEqual(orchestrator.ai, ai);
    assert.strictEqual(orchestrator.telemetry, telemetry);
  });

  test('keeps concurrent session scopes isolated under load', async () => {
    const sessionIds = Array.from({ length: 24 }, (_, index) => `session-${index + 1}`);

    const resolved = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const sessionContainer = createSessionContainer(sessionId);
        const memory = createMockMemory(`memory-${sessionId}`);
        const registry = createMockRegistry(`registry-${sessionId}`);
        const telemetry = createMockTelemetry(`telemetry-${sessionId}`);

        sessionContainer.registerInstance(DI_TOKENS.memoryManager, memory);
        sessionContainer.registerInstance(DI_TOKENS.agentRegistry, registry);
        sessionContainer.registerInstance(DI_TOKENS.aiMetaLayer, { call: async () => ({ text: sessionId }) });
        sessionContainer.registerInstance(DI_TOKENS.telemetryService, telemetry);

        const orchestrator = sessionContainer.resolve(AgentOrchestrator);
        const executionContext = orchestrator.createExecutionContext(`objective-${sessionId}`);

        return {
          orchestrator,
          sessionId: orchestrator.sessionId,
          memoryId: orchestrator.memory.id,
          registryId: orchestrator.registry.id,
          executionContextId: executionContext.sessionId,
        };
      })
    );

    assert.strictEqual(new Set(resolved.map((entry) => entry.orchestrator)).size, sessionIds.length);
    assert.deepStrictEqual(
      resolved.map((entry) => entry.sessionId).sort(),
      [...sessionIds].sort()
    );
    assert.strictEqual(new Set(resolved.map((entry) => entry.memoryId)).size, sessionIds.length);
    assert.strictEqual(new Set(resolved.map((entry) => entry.registryId)).size, sessionIds.length);
    assert.strictEqual(
      new Set(resolved.map((entry) => entry.executionContextId)).size,
      sessionIds.length
    );
  });
});
