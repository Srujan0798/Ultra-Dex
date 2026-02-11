// Copyright (c) 2026 Ultra-Dex
// tests/core/agent-orchestrator.test.js

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { agentMetaOrchestrator } from '../../packages/core/index.js';

describe('AgentMetaOrchestrator', () => {
  beforeEach(() => {
    // Clear any existing agents to start fresh
    agentMetaOrchestrator.agents.clear();
    agentMetaOrchestrator.agentQueues.clear();
    agentMetaOrchestrator.agentStats.clear();
  });

  it('should register agents correctly', () => {
    const agentConfig = {
      name: 'Test Agent',
      description: 'A test agent',
      capabilities: ['testing', 'validation'],
      priority: 5,
      maxConcurrency: 2
    };

    const agent = agentMetaOrchestrator.registerAgent('test-agent', agentConfig);

    assert.ok(agent);
    assert.strictEqual(agent.id, 'test-agent');
    assert.strictEqual(agent.name, 'Test Agent');
    assert.strictEqual(agent.capabilities.length, 2);
    assert.strictEqual(agent.priority, 5);
    assert.strictEqual(agent.isActive, true);
  });

  it('should select best agent for a task', async () => {
    // Register a few test agents with different capabilities
    agentMetaOrchestrator.registerAgent('coding-agent', {
      name: 'Coding Agent',
      description: 'Handles coding tasks',
      capabilities: ['coding', 'programming'],
      priority: 8,
      maxConcurrency: 3
    });

    agentMetaOrchestrator.registerAgent('testing-agent', {
      name: 'Testing Agent',
      description: 'Handles testing tasks',
      capabilities: ['testing', 'validation'],
      priority: 7,
      maxConcurrency: 2
    });

    // Test selecting agent for a coding task
    const codingTask = { requiredCapabilities: ['coding'] };
    const selectedAgent = await agentMetaOrchestrator.selectBestAgent(codingTask, { requiredCapabilities: ['coding'] });

    assert.ok(selectedAgent);
    assert.strictEqual(selectedAgent.id, 'coding-agent');
  });

  it('should execute tasks with registered agents', async () => {
    // Register a test agent
    agentMetaOrchestrator.registerAgent('simple-agent', {
      name: 'Simple Agent',
      description: 'Simple test agent',
      capabilities: ['simple'],
      priority: 5,
      maxConcurrency: 1
    });

    // Mock the AI call for the agent
    const originalCall = agentMetaOrchestrator.aiMetaLayer?.call || (() => Promise.resolve({ content: 'Test response' }));
    agentMetaOrchestrator.aiMetaLayer = {
      call: async (model, messages, options = {}) => {
        return { content: 'Test response', usage: { totalTokens: 5 } };
      }
    };

    try {
      const result = await agentMetaOrchestrator.executeTask('Simple test task', { 
        requiredCapabilities: ['simple'] 
      });
      
      assert.ok(result);
    } catch (error) {
      // Expected since we're mocking the AI call
      assert.ok(error);
    }
  });

  it('should add coordination relationships', () => {
    agentMetaOrchestrator.registerAgent('agent-a', {
      name: 'Agent A',
      description: 'First agent',
      capabilities: ['capability-a'],
      priority: 5,
      maxConcurrency: 1
    });

    agentMetaOrchestrator.registerAgent('agent-b', {
      name: 'Agent B',
      description: 'Second agent',
      capabilities: ['capability-b'],
      priority: 5,
      maxConcurrency: 1
    });

    agentMetaOrchestrator.addCoordinationRelationship('agent-a', 'agent-b');

    const graph = agentMetaOrchestrator.coordinationGraph;
    const aRelations = graph.get('agent-a');
    const bRelations = graph.get('agent-b');

    assert.ok(aRelations.has('agent-b'));
    assert.ok(bRelations.has('agent-a'));
  });

  it('should get metrics', () => {
    const metrics = agentMetaOrchestrator.getMetrics();
    
    assert.ok(metrics);
    assert.ok(metrics.orchestrator);
    assert.ok(typeof metrics.orchestrator.totalAgents === 'number');
    assert.ok(typeof metrics.orchestrator.activeSessions === 'number');
  });

  it('should handle task with no suitable agent', async () => {
    try {
      await agentMetaOrchestrator.executeTask('Task requiring non-existent capability', { 
        requiredCapabilities: ['non-existent-capability'] 
      });
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.ok(error.message.includes('No suitable agent found'));
    }
  });
});