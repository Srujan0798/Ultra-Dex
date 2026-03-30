import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Task Blocking', () => {
  it('MUST block tasks before execution', async () => {
    const orchestrator = new AgentOrchestrator();
    
    // Add blocking policy
    orchestrator.governance.policies.addPolicy({
      id: 'block-dangerous',
      condition: (ctx) => !ctx.resource.includes('dangerous'),
      enforcement: 'block'
    });

    // Attempt dangerous task
    try {
      await orchestrator.executeTask('dangerous task', {});
      assert.fail('Should have thrown GovernanceDeniedException');
    } catch (error) {
      console.log('Error caught:', error.name, error.message);
      assert.ok(error instanceof GovernanceDeniedException || error.name === 'GovernanceDeniedException', 
        `Expected GovernanceDeniedException but got ${error.name}: ${error.message}`);
    }
  });

  it('MUST allow safe tasks', async () => {
    const orchestrator = new AgentOrchestrator();
    
    // Mock AI layer to avoid dependency
    orchestrator.getAiLayer = async () => ({
      call: async () => ({ text: 'task complete' })
    });
    
    orchestrator.memory = {
      search: async () => [],
      add: async () => {}
    };
    
    orchestrator.registry = {
      getAgentPrompt: async () => 'system prompt'
    };

    const result = await orchestrator.executeTask('safe task', {});
    assert.ok(result, 'Safe task should execute');
  });
});
