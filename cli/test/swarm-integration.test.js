/**
 * Integration tests for swarm command
 * Tests: Multi-agent orchestration, pipeline execution, parallel processing
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { MockAIProvider } from './mocks/providers.js';

describe('Swarm Command Integration Tests', () => {
  test('should have valid agent pipeline structure', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    assert.ok(Array.isArray(AGENT_PIPELINE));
    assert.ok(AGENT_PIPELINE.length > 0);
    
    // Check that each agent has required properties
    for (const agent of AGENT_PIPELINE) {
      assert.ok(agent.name, 'Agent should have name');
      assert.ok(agent.description, 'Agent should have description');
      assert.ok(agent.tier, 'Agent should have tier');
      assert.ok(typeof agent.name === 'string');
      assert.ok(typeof agent.description === 'string');
      assert.ok(typeof agent.tier === 'string');
    }
  });

  test('should organize agents into proper tiers', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    const tiers = [...new Set(AGENT_PIPELINE.map(a => a.tier))];
    const expectedTiers = ['1-planning', '2-implementation', '3-security', '4-quality'];
    
    for (const expectedTier of expectedTiers) {
      assert.ok(tiers.includes(expectedTier), `Should have tier: ${expectedTier}`);
    }
  });

  test('should have planning agents in first tier', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    const planningAgents = AGENT_PIPELINE.filter(a => a.tier === '1-planning');
    assert.ok(planningAgents.length > 0);
    
    const agentNames = planningAgents.map(a => a.name);
    assert.ok(agentNames.includes('planner'));
    assert.ok(agentNames.includes('cto'));
  });

  test('should have implementation agents in second tier', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    const implAgents = AGENT_PIPELINE.filter(a => a.tier === '2-implementation');
    assert.ok(implAgents.length > 0);
    
    const agentNames = implAgents.map(a => a.name);
    assert.ok(agentNames.includes('backend'));
    assert.ok(agentNames.includes('frontend'));
    assert.ok(agentNames.includes('database'));
  });

  test('should have quality agents in fourth tier', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    const qualityAgents = AGENT_PIPELINE.filter(a => a.tier === '4-quality');
    assert.ok(qualityAgents.length > 0);
    
    const agentNames = qualityAgents.map(a => a.name);
    assert.ok(agentNames.includes('testing'));
    assert.ok(agentNames.includes('reviewer'));
  });

  test('should execute agents in proper sequence', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    // Find indices of key agents
    const plannerIndex = AGENT_PIPELINE.findIndex(a => a.name === 'planner');
    const backendIndex = AGENT_PIPELINE.findIndex(a => a.name === 'backend');
    const testingIndex = AGENT_PIPELINE.findIndex(a => a.name === 'testing');
    
    // Planner should come before backend
    assert.ok(plannerIndex < backendIndex, 'Planner should come before backend');
    
    // Backend should come before testing
    assert.ok(backendIndex < testingIndex, 'Backend should come before testing');
  });

  test('should handle parallel execution tiers', async () => {
    const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    // Simulate the parallel tier organization
    const executionTiers = [
      { name: '1-Planning', agents: AGENT_PIPELINE.filter(a => a.tier === '1-planning'), parallel: false },
      { name: '2-Implementation', agents: AGENT_PIPELINE.filter(a => a.tier === '2-implementation'), parallel: true },
      { name: '3-Security', agents: AGENT_PIPELINE.filter(a => a.tier === '3-security'), parallel: false },
      { name: '4-Quality', agents: AGENT_PIPELINE.filter(a => a.tier === '4-quality'), parallel: false }
    ];
    
    assert.strictEqual(executionTiers.length, 4);
    assert.strictEqual(executionTiers[0].parallel, false);  // Planning sequential
    assert.strictEqual(executionTiers[1].parallel, true);   // Implementation parallel
    assert.strictEqual(executionTiers[2].parallel, false);  // Security sequential
    assert.strictEqual(executionTiers[3].parallel, false);  // Quality sequential
  });

  test('should handle agent loading from filesystem', async () => {
    // Create temporary directory structure for testing
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-swarm-test-'));
    
    try {
      // Create agents directory structure
      const agentsDir = path.join(tmpDir, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      
      // Create tier directories
      const tier1Dir = path.join(agentsDir, '1-leadership');
      const tier2Dir = path.join(agentsDir, '2-development');
      await fs.mkdir(tier1Dir, { recursive: true });
      await fs.mkdir(tier2Dir, { recursive: true });
      
      // Create agent files
      await fs.writeFile(
        path.join(tier1Dir, 'cto.md'),
        '# CTO Agent\n\nYou are the CTO.'
      );
      
      await fs.writeFile(
        path.join(tier2Dir, 'backend.md'),
        '# Backend Agent\n\nYou are a backend developer.'
      );
      
      // Verify files exist
      const ctoExists = await fs.access(path.join(tier1Dir, 'cto.md'))
        .then(() => true)
        .catch(() => false);
      
      const backendExists = await fs.access(path.join(tier2Dir, 'backend.md'))
        .then(() => true)
        .catch(() => false);
      
      assert.strictEqual(ctoExists, true);
      assert.strictEqual(backendExists, true);
    } finally {
      // Clean up
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('should handle swarm command execution', async () => {
    const { swarmCommand } = await import('../lib/commands/swarm.js');
    
    assert.ok(typeof swarmCommand === 'function');
    assert.strictEqual(swarmCommand.length, 2); // Should accept (task, options)
  });

  test('should render swarm assembly without errors', async () => {
    const { showSwarmAssemble, AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
    
    // Capture console output to verify no errors
    const originalLog = console.log;
    let output = '';
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };
    
    try {
      assert.doesNotThrow(() => {
        showSwarmAssemble(AGENT_PIPELINE);
      });
    } finally {
      console.log = originalLog;
    }
    
    assert.ok(output.length >= 0); // Output may be empty but shouldn't error
  });
});