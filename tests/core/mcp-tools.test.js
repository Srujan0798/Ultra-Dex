import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import MCPServerManager from '../../src/core/mcp/server-manager.js';

describe('MCP core tools', () => {
  let manager;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-tools-'));

    const agentRegistry = {
      agents: new Map([
        ['planner', { status: 'idle', healthScore: 0.98 }],
        ['backend', { status: 'busy', currentTask: 'Implement API', healthScore: 0.87 }],
      ]),
    };

    const memory = {
      async retrieve(query, { limit }) {
        return {
          items: [
            {
              text: `Match for ${query}`,
              score: 0.91,
              tier: 'warm',
              timestamp: '2026-04-06T00:00:00.000Z',
            },
            {
              text: `Secondary match for ${query}`,
              score: 0.72,
              tier: 'cold',
              timestamp: '2026-04-05T00:00:00.000Z',
            },
          ].slice(0, limit),
        };
      },
    };

    const providerRouter = {
      providers: new Map([
        [
          'openai',
          {
            name: 'OpenAI',
            models: [{ id: 'gpt-4o' }],
            costPer1kTokens: { input: 0.005, output: 0.015 },
            enabled: true,
          },
        ],
        [
          'ollama',
          {
            name: 'Ollama',
            models: [{ id: 'llama3.2' }],
            costPer1kTokens: { input: 0, output: 0 },
            enabled: true,
          },
        ],
      ]),
      getHealth(providerId) {
        return providerId === 'openai'
          ? { status: 'healthy', averageLatency: 180 }
          : { status: 'degraded', averageLatency: 950 };
      },
    };

    manager = new MCPServerManager({
      serversPath: tempDir,
      loadBuiltInServers: false,
      agentRegistry,
      memory,
      providerRouter,
    });

    await manager.initialize();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('registers the expected in-process MCP tools', () => {
    const toolNames = manager
      .listTools()
      .map((tool) => tool.name)
      .sort();
    assert.deepEqual(toolNames, ['agent-status', 'memory-search', 'provider-info', 'task-submit']);
  });

  it('returns agent status for all known agents', async () => {
    const result = await manager.callTool('ultra-dex-core', 'agent-status', {});
    assert.equal(result.agents.length, 2);
    assert.equal(result.agents[0].id, 'planner');
  });

  it('filters agent status by agent id', async () => {
    const result = await manager.callTool('ultra-dex-core', 'agent-status', { agentId: 'backend' });
    assert.deepEqual(result.agents, [
      {
        id: 'backend',
        status: 'busy',
        currentTask: 'Implement API',
        healthScore: 0.87,
      },
    ]);
  });

  it('queues submitted tasks and returns queue metadata', async () => {
    const result = await manager.callTool('ultra-dex-core', 'task-submit', {
      task: 'Ship the dashboard build fix',
      priority: 'high',
      agentPreference: 'planner',
    });
    assert.equal(result.status, 'queued');
    assert.match(result.taskId, /^task_/);
    assert.equal(manager.taskQueue.length, 1);
  });

  it('keeps subsequent submitted tasks in FIFO queue order', async () => {
    await manager.callTool('ultra-dex-core', 'task-submit', { task: 'First task' });
    await manager.callTool('ultra-dex-core', 'task-submit', { task: 'Second task' });
    assert.equal(manager.taskQueue[0].task, 'First task');
    assert.equal(manager.taskQueue[1].task, 'Second task');
  });

  it('returns normalized memory search results', async () => {
    const result = await manager.callTool('ultra-dex-core', 'memory-search', {
      query: 'governance',
      limit: 2,
    });
    assert.equal(result.results.length, 2);
    assert.equal(result.results[0].content, 'Match for governance');
    assert.equal(result.results[0].tier, 'warm');
  });

  it('returns an empty memory result set when no backend is available', async () => {
    manager.memory = null;
    const result = await manager.callTool('ultra-dex-core', 'memory-search', {
      query: 'missing',
    });
    assert.deepEqual(result.results, []);
  });

  it('returns provider health and pricing data', async () => {
    const result = await manager.callTool('ultra-dex-core', 'provider-info', {});
    assert.equal(result.providers.length, 2);
    assert.deepEqual(result.providers[0], {
      name: 'OpenAI',
      status: 'healthy',
      latencyP50: 180,
      costPer1kTokens: { input: 0.005, output: 0.015 },
      model: 'gpt-4o',
    });
  });

  it('returns an empty provider list when no router is attached', async () => {
    manager.providerRouter = null;
    const result = await manager.callTool('ultra-dex-core', 'provider-info', {});
    assert.deepEqual(result.providers, []);
  });
});
