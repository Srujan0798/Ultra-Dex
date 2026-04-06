// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from './orchestrator-minimal.js';
import { EventEmitter } from 'events';

// Mocks
class MockMemory extends EventEmitter {
  constructor() { super(); }
  async init() { return true; }
  async search() { return []; }
  async add() { return true; }
}

class MockAI {
  async call() { return { text: 'Mock AI Response' }; }
}

class MockGovernance {
  constructor() {
    this.audit = { record: async () => {} };
  }
  async gate() { return { allowed: true }; }
}

describe('AgentOrchestrator', () => {
  let orchestrator;
  let mockAi;
  let mockMemory;

  beforeEach(() => {
    mockAi = new MockAI();
    mockMemory = new MockMemory();
    orchestrator = new AgentOrchestrator({
      ai: mockAi,
      autoDiscover: false
    });
    orchestrator.memory = mockMemory;
    orchestrator.governance = new MockGovernance();
  });

  it('should initialize and register tools', async () => {
    // Mock the MCP server factory to avoid real tool registration
    orchestrator.mcpServerFactory = async () => ({
      toolsMap: new Map([['test-tool', { description: 'test', schema: {}, handler: async () => 'result' }]])
    });
    
    // Partially mock initialize to avoid self-healing import issues in tests
    orchestrator.getSelfHealing = async () => ({ initialize: async () => {} });
    
    await orchestrator.initializeMcpServer();
    const tools = await orchestrator.getTools();
    assert.strictEqual(tools.tools.length, 1);
    assert.strictEqual(tools.tools[0].name, 'test-tool');
  });

  it('should execute a task and emit completion event', async () => {
    const events = [];
    orchestrator.on('task:start', (data) => events.push(['start', data]));
    orchestrator.on('task:complete', (data) => events.push(['complete', data]));

    const result = await orchestrator.executeTask('Do something', { agentId: 'test-agent' });
    
    assert.strictEqual(result.status, 'COMPLETE');
    assert.strictEqual(result.output, 'Mock AI Response');
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0][0], 'start');
    assert.strictEqual(events[1][0], 'complete');
  });

  it('should block task execution via governance', async () => {
    orchestrator.governance.gate = async () => ({ allowed: false, reason: 'Security violation' });

    await assert.rejects(
      () => orchestrator.executeTask('Dangerous task'),
      { message: /Task execution blocked by governance policy/ }
    );
  });

  it('should select correct agent based on capabilities', async () => {
    const uiAgent = {
      id: 'ui-agent',
      name: 'UI Agent',
      description: 'UI stuff',
      capabilities: ['frontend']
    };
    orchestrator.registry.findAgentsByCapabilities = (caps) => {
        if (caps.includes('frontend')) return [uiAgent];
        return [];
    };

    const agentId = orchestrator.selectAgentForTask('Build a button', { requiredCapabilities: ['frontend'] });
    assert.strictEqual(agentId, 'ui-agent');
  });

  it('should fallback to keyword-based agent selection', () => {
    const agentId = orchestrator.selectAgentForTask('Create a database schema');
    assert.strictEqual(agentId, 'database');
  });

  it('should execute a tool and audit the action', async () => {
    const toolHandler = async (args) => `Handled ${args.input}`;
    orchestrator.mcpServer.toolsMap.set('test-tool', { 
      description: 'test', 
      schema: {}, 
      handler: toolHandler 
    });

    const auditRecords = [];
    orchestrator.governance.audit.record = async (record) => auditRecords.push(record);

    const result = await orchestrator.executeTool('test-tool', { input: 'data' });
    
    assert.strictEqual(result, 'Handled data');
    assert.strictEqual(auditRecords.length, 1);
    assert.strictEqual(auditRecords[0].action, 'tool_execution');
    assert.strictEqual(auditRecords[0].result, 'success');
  });

  it('should prune old tasks during executeNexus', async () => {
    let pruneCalled = false;
    orchestrator.tasks.prune = () => { pruneCalled = true; };
    
    // Mock nexusExecutor to avoid Ralph Loop dependency in this simple test
    orchestrator.nexusExecutor = async () => ({ status: 'ok' });

    await orchestrator.executeNexus('High level objective');
    assert.strictEqual(pruneCalled, true);
  });
});
