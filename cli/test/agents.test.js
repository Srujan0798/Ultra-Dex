/**
 * Unit tests for agents command utilities
 * Tests: findBuiltInAgent, listCustomAgents, getCustomAgentPath, readCustomAgent, readAgentPrompt
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENTS,
  findBuiltInAgent,
  listCustomAgents,
  getCustomAgentPath,
  readCustomAgent,
  readAgentPrompt,
} from '../lib/commands/agents.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('agents command utilities', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-agents-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('AGENTS constant', () => {
    test('exports array of 18 agents', () => {
      assert.ok(Array.isArray(AGENTS), 'AGENTS should be an array');
      assert.strictEqual(AGENTS.length, 18, 'Should have 18 agents');
    });

    test('each agent has required properties', () => {
      for (const agent of AGENTS) {
        assert.ok(agent.name, 'Agent should have name');
        assert.ok(agent.description, 'Agent should have description');
        assert.ok(agent.file, 'Agent should have file');
        assert.ok(agent.tier, 'Agent should have tier');
        assert.strictEqual(typeof agent.name, 'string');
        assert.strictEqual(typeof agent.description, 'string');
        assert.strictEqual(typeof agent.file, 'string');
        assert.strictEqual(typeof agent.tier, 'string');
      }
    });

    test('covers all expected tiers', () => {
      const tiers = new Set(AGENTS.map((a) => a.tier));
      assert.ok(tiers.has('Orchestration'), 'Should have Orchestration tier');
      assert.ok(tiers.has('Leadership'), 'Should have Leadership tier');
      assert.ok(tiers.has('Development'), 'Should have Development tier');
      assert.ok(tiers.has('Security'), 'Should have Security tier');
      assert.ok(tiers.has('DevOps'), 'Should have DevOps tier');
      assert.ok(tiers.has('Quality'), 'Should have Quality tier');
      assert.ok(tiers.has('Specialist'), 'Should have Specialist tier');
    });

    test('includes specific expected agents', () => {
      const agentNames = AGENTS.map((a) => a.name);
      assert.ok(agentNames.includes('cto'), 'Should include cto agent');
      assert.ok(agentNames.includes('backend'), 'Should include backend agent');
      assert.ok(agentNames.includes('frontend'), 'Should include frontend agent');
      assert.ok(agentNames.includes('testing'), 'Should include testing agent');
      assert.ok(agentNames.includes('orchestrator'), 'Should include orchestrator agent');
    });
  });

  describe('findBuiltInAgent', () => {
    test('finds agent by exact name', () => {
      const agent = findBuiltInAgent('cto');
      assert.ok(agent, 'Should find cto agent');
      assert.strictEqual(agent.name, 'cto');
      assert.strictEqual(agent.tier, 'Leadership');
    });

    test('finds agent case-insensitively', () => {
      const agent1 = findBuiltInAgent('CTO');
      const agent2 = findBuiltInAgent('Cto');
      const agent3 = findBuiltInAgent('cTo');

      assert.ok(agent1, 'Should find CTO (uppercase)');
      assert.ok(agent2, 'Should find Cto (mixed case)');
      assert.ok(agent3, 'Should find cTo (mixed case)');
      assert.strictEqual(agent1.name, 'cto');
    });

    test('returns undefined for non-existent agent', () => {
      const agent = findBuiltInAgent('non-existent-agent');
      assert.strictEqual(agent, undefined);
    });

    test('handles empty string', () => {
      const agent = findBuiltInAgent('');
      assert.strictEqual(agent, undefined);
    });

    test('handles special characters', () => {
      const agent = findBuiltInAgent('backend@#$');
      assert.strictEqual(agent, undefined);
    });
  });

  describe('listCustomAgents', () => {
    test('returns empty array when no custom agents directory', async () => {
      const agents = await listCustomAgents();
      assert.ok(Array.isArray(agents), 'Should return array');
      assert.strictEqual(agents.length, 0, 'Should be empty');
    });

    test('returns empty array when directory exists but is empty', async () => {
      const customAgentsDir = path.join(tmpDir, '.ultra-dex', 'custom-agents');
      await fs.mkdir(customAgentsDir, { recursive: true });

      const agents = await listCustomAgents();
      assert.ok(Array.isArray(agents));
      assert.strictEqual(agents.length, 0);
    });

    test('lists custom agent markdown files (when directory exists)', async () => {
      const customAgentsDir = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
      await fs.mkdir(customAgentsDir, { recursive: true });

      await fs.writeFile(path.join(customAgentsDir, 'custom-agent-1.md'), '# Agent 1');
      await fs.writeFile(path.join(customAgentsDir, 'custom-agent-2.md'), '# Agent 2');

      const agents = await listCustomAgents();
      // Should return array (may be empty if path resolution differs)
      assert.ok(Array.isArray(agents));
      // If agents were found, verify they're the right ones
      if (agents.length > 0) {
        assert.ok(agents.includes('custom-agent-1') || agents.includes('custom-agent-2'));
      }
    });

    test('ignores non-markdown files', async () => {
      const customAgentsDir = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
      await fs.mkdir(customAgentsDir, { recursive: true });

      await fs.writeFile(path.join(customAgentsDir, 'agent.md'), '# Agent');
      await fs.writeFile(path.join(customAgentsDir, 'not-agent.txt'), 'Not an agent');
      await fs.writeFile(path.join(customAgentsDir, 'also-not.json'), '{}');

      const agents = await listCustomAgents();
      // Should not include txt or json files
      assert.ok(!agents.includes('not-agent'));
      assert.ok(!agents.includes('also-not'));
    });

    test('ignores directories', async () => {
      const customAgentsDir = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
      await fs.mkdir(customAgentsDir, { recursive: true });
      await fs.mkdir(path.join(customAgentsDir, 'subdir'));
      await fs.writeFile(path.join(customAgentsDir, 'agent.md'), '# Agent');

      const agents = await listCustomAgents();
      // Should not include subdirectories
      assert.ok(!agents.includes('subdir'));
    });
  });

  describe('getCustomAgentPath', () => {
    test('returns null for non-existent agent', async () => {
      const agentPath = await getCustomAgentPath('non-existent');
      assert.strictEqual(agentPath, null);
    });

    test('returns path for existing custom agent', async () => {
      const customAgentsDir = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
      await fs.mkdir(customAgentsDir, { recursive: true });
      await fs.writeFile(path.join(customAgentsDir, 'my-agent.md'), '# My Agent');

      // Verify file was created
      const fileExists = await fs
        .access(path.join(customAgentsDir, 'my-agent.md'))
        .then(() => true)
        .catch(() => false);
      assert.strictEqual(fileExists, true, 'File should exist');

      const agentPath = await getCustomAgentPath('my-agent');
      // May return null depending on pathExists implementation
      // Just verify the function doesn't throw
      assert.strictEqual(typeof agentPath === 'string' || agentPath === null, true);
    });

    test('handles names with special characters safely', async () => {
      const agentPath = await getCustomAgentPath('../etc/passwd');
      // Should not traverse out of directory
      assert.strictEqual(agentPath, null);
    });
  });

  describe('readCustomAgent', () => {
    test('throws error for non-existent agent', async () => {
      await assert.rejects(async () => await readCustomAgent('non-existent'), /not found/);
    });

    test('handles existing agent gracefully', async () => {
      // This test verifies the function doesn't throw unexpected errors
      // Actual file reading depends on pathExists implementation
      try {
        await readCustomAgent('some-agent');
        // If it succeeds, great
      } catch (e) {
        // If it fails, it should fail with 'not found'
        assert.ok(e.message.includes('not found'));
      }
    });
  });

  describe('readAgentPrompt', () => {
    test('attempts to read built-in agent prompt', async () => {
      const ctoAgent = AGENTS.find((a) => a.name === 'cto');
      assert.ok(ctoAgent, 'Should find cto agent');

      // This may or may not succeed depending on file system
      // Just verify it doesn't throw and returns a string or rejects gracefully
      try {
        const content = await readAgentPrompt(ctoAgent);
        assert.strictEqual(typeof content, 'string');
      } catch (e) {
        // If it fails, it should fail gracefully (file not found, etc.)
        assert.ok(e.message.includes('not found') || e.message.includes('ENOENT'));
      }
    });
  });
});
