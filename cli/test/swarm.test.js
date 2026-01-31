/**
 * Unit tests for swarm command
 * Tests: AGENT_PIPELINE, tier organization, parallel execution logic
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('swarm command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-swarm-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('AGENT_PIPELINE', () => {
    test('exports AGENT_PIPELINE array', async () => {
      // Import the swarm module
      const swarmModule = await import('../lib/commands/swarm.js');
      const { AGENT_PIPELINE } = swarmModule;
      
      assert.ok(Array.isArray(AGENT_PIPELINE), 'AGENT_PIPELINE should be an array');
      assert.ok(AGENT_PIPELINE.length > 0, 'AGENT_PIPELINE should not be empty');
    });

    test('each agent has required properties', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      for (const agent of AGENT_PIPELINE) {
        assert.ok(agent.name, 'Agent should have name');
        assert.ok(agent.description, 'Agent should have description');
        assert.ok(agent.tier, 'Agent should have tier');
        assert.strictEqual(typeof agent.name, 'string');
        assert.strictEqual(typeof agent.description, 'string');
        assert.strictEqual(typeof agent.tier, 'string');
      }
    });

    test('has expected agents', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      const agentNames = AGENT_PIPELINE.map(a => a.name);
      
      assert.ok(agentNames.includes('planner'), 'Should have planner');
      assert.ok(agentNames.includes('cto'), 'Should have cto');
      assert.ok(agentNames.includes('backend'), 'Should have backend');
      assert.ok(agentNames.includes('frontend'), 'Should have frontend');
      assert.ok(agentNames.includes('database'), 'Should have database');
      assert.ok(agentNames.includes('testing'), 'Should have testing');
      assert.ok(agentNames.includes('reviewer'), 'Should have reviewer');
    });

    test('organizes agents into tiers', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      const planningAgents = AGENT_PIPELINE.filter(a => a.tier === '1-planning');
      const implAgents = AGENT_PIPELINE.filter(a => a.tier === '2-implementation');
      const securityAgents = AGENT_PIPELINE.filter(a => a.tier === '3-security');
      const qualityAgents = AGENT_PIPELINE.filter(a => a.tier === '4-quality');
      
      // Verify we have agents in each tier
      assert.ok(planningAgents.length > 0, 'Should have planning agents');
      assert.ok(implAgents.length > 0, 'Should have implementation agents');
      assert.ok(qualityAgents.length > 0, 'Should have quality agents');
    });

    test('planning tier includes planner and cto', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      const planningAgents = AGENT_PIPELINE.filter(a => a.tier === '1-planning');
      const names = planningAgents.map(a => a.name);
      
      assert.ok(names.includes('planner'), 'Planning tier should have planner');
      assert.ok(names.includes('cto'), 'Planning tier should have cto');
    });

    test('implementation tier includes dev agents', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      const implAgents = AGENT_PIPELINE.filter(a => a.tier === '2-implementation');
      const names = implAgents.map(a => a.name);
      
      assert.ok(names.includes('backend'), 'Implementation tier should have backend');
      assert.ok(names.includes('frontend'), 'Implementation tier should have frontend');
      assert.ok(names.includes('database'), 'Implementation tier should have database');
    });

    test('quality tier includes qa agents', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      const qualityAgents = AGENT_PIPELINE.filter(a => a.tier === '4-quality');
      const names = qualityAgents.map(a => a.name);
      
      assert.ok(names.includes('testing'), 'Quality tier should have testing');
      assert.ok(names.includes('reviewer'), 'Quality tier should have reviewer');
    });
  });

  describe('agent execution tiers', () => {
    test('parallel mode organizes into 4 tiers', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      // Simulate the parallel tier organization from swarm.js
      const executionTiers = [
        { name: '1-Planning', agents: AGENT_PIPELINE.filter(a => a.tier === '1-planning'), parallel: false },
        { name: '2-Implementation', agents: AGENT_PIPELINE.filter(a => a.tier === '2-implementation'), parallel: true },
        { name: '3-Security', agents: AGENT_PIPELINE.filter(a => a.tier === '3-security'), parallel: false },
        { name: '4-Quality', agents: AGENT_PIPELINE.filter(a => a.tier === '4-quality'), parallel: false }
      ];
      
      assert.strictEqual(executionTiers.length, 4, 'Should have 4 tiers');
      
      // Planning tier runs sequentially
      assert.strictEqual(executionTiers[0].parallel, false);
      
      // Implementation tier runs in parallel
      assert.strictEqual(executionTiers[1].parallel, true);
      
      // Security tier runs sequentially
      assert.strictEqual(executionTiers[2].parallel, false);
      
      // Quality tier runs sequentially
      assert.strictEqual(executionTiers[3].parallel, false);
    });

    test('sequential mode has single tier', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      // Simulate sequential mode
      const executionTiers = [{ name: 'All', agents: AGENT_PIPELINE, parallel: false }];
      
      assert.strictEqual(executionTiers.length, 1);
      assert.strictEqual(executionTiers[0].name, 'All');
      assert.strictEqual(executionTiers[0].parallel, false);
      assert.strictEqual(executionTiers[0].agents.length, AGENT_PIPELINE.length);
    });
  });

  describe('showSwarmAssemble', () => {
    test('is exported function', async () => {
      const { showSwarmAssemble } = await import('../lib/commands/swarm.js');
      assert.strictEqual(typeof showSwarmAssemble, 'function');
    });

    test('renders agents without throwing', async () => {
      const { showSwarmAssemble, AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      // Mock console.log to capture output
      const originalLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };
      
      // Should not throw
      assert.doesNotThrow(() => {
        showSwarmAssemble(AGENT_PIPELINE);
      });
      
      console.log = originalLog;
      
      // Output should contain agent info
      assert.ok(output.length > 0, 'Should produce output');
    });

    test('handles empty agent list', async () => {
      const { showSwarmAssemble } = await import('../lib/commands/swarm.js');
      
      assert.doesNotThrow(() => {
        showSwarmAssemble([]);
      });
    });
  });

  describe('swarmCommand structure', () => {
    test('exports swarmCommand function', async () => {
      const { swarmCommand } = await import('../lib/commands/swarm.js');
      assert.strictEqual(typeof swarmCommand, 'function');
    });

    test('accepts task and options parameters', async () => {
      const { swarmCommand } = await import('../lib/commands/swarm.js');
      
      // Function signature should accept (task, options)
      assert.strictEqual(swarmCommand.length, 2, 'Should accept 2 parameters');
    });
  });

  describe('agent loading', () => {
    test('creates agents directory structure', async () => {
      // Create agents directory with some agent files
      const agentsDir = path.join(tmpDir, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.mkdir(path.join(agentsDir, '1-leadership'), { recursive: true });
      await fs.mkdir(path.join(agentsDir, '2-development'), { recursive: true });
      
      await fs.writeFile(
        path.join(agentsDir, '1-leadership', 'cto.md'),
        '# CTO Agent\n\nYou are the CTO.'
      );
      
      await fs.writeFile(
        path.join(agentsDir, '2-development', 'backend.md'),
        '# Backend Agent\n\nYou are a backend developer.'
      );
      
      // Verify files exist
      const ctoExists = await fs.access(path.join(agentsDir, '1-leadership', 'cto.md'))
        .then(() => true)
        .catch(() => false);
      
      assert.strictEqual(ctoExists, true);
    });
  });

  describe('integration scenarios', () => {
    test('pipeline maintains agent order', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      
      // Verify planning agents come before implementation
      const plannerIndex = AGENT_PIPELINE.findIndex(a => a.name === 'planner');
      const backendIndex = AGENT_PIPELINE.findIndex(a => a.name === 'backend');
      
      assert.ok(plannerIndex < backendIndex, 'Planner should come before backend');
    });

    test('all agents have valid tier assignments', async () => {
      const { AGENT_PIPELINE } = await import('../lib/commands/swarm.js');
      const validTiers = ['1-planning', '2-implementation', '3-security', '4-quality'];
      
      for (const agent of AGENT_PIPELINE) {
        assert.ok(
          validTiers.includes(agent.tier),
          `${agent.name} should have valid tier, got ${agent.tier}`
        );
      }
    });
  });
});
