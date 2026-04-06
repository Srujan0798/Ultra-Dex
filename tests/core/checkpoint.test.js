// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Unit tests for checkpoint feature
 * @module tests/core/checkpoint
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { AutonomousAgent } from '../../apps/cli/lib/autonomous/agent.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock provider to avoid real API calls
class MockProvider {
  constructor() {
    this.name = 'mock';
  }

  getName() {
    return this.name;
  }

  async generate() {
    return { content: 'console.log("mock");', usage: { inputTokens: 1, outputTokens: 1 } };
  }

  async generateStream() {
    return { content: 'streamed' };
  }

  async validateApiKey() {
    return true;
  }

  getAvailableModels() {
    return [{ id: 'mock-model', name: 'Mock Model' }];
  }
}

// Note: Provider mocking is handled by lazy loading in the modules

describe('Checkpoint Feature Tests', () => {
  let agent;
  let testDir;
  const originalCwd = process.cwd();

  beforeEach(async () => {
    // Create unique test directory
    testDir = path.join(os.tmpdir(), `ultra-dex-chk-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Change to test directory
    process.chdir(testDir);

    // Create agent
    agent = new AutonomousAgent({
      provider: 'mock',
      persistContext: false,
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      process.chdir(originalCwd);
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('saveCheckpoint() creates file in .ultra/checkpoints/', async () => {
    // Set up agent state directly (no need to run full loop)
    agent._sessionId = 'test-session-123';
    agent._currentGoal = 'Test goal';
    agent._currentPlan = { tasks: [] };
    agent._completedTasks = ['task1'];

    // Save checkpoint
    const checkpointId = await agent.saveCheckpoint();

    // Verify checkpoint file exists
    const checkpointPath = path.join(testDir, '.ultra', 'checkpoints', `${checkpointId}.json`);
    const stat = await fs.stat(checkpointPath);
    assert.ok(stat.isFile(), 'Checkpoint file should exist');
  });

  it("saveCheckpoint() returns checkpoint ID starting with 'chk_'", async () => {
    agent._sessionId = 'test-session';
    agent._currentGoal = 'Test';

    const checkpointId = await agent.saveCheckpoint();

    assert.ok(checkpointId.startsWith('chk_'), "Checkpoint ID should start with 'chk_'");
  });

  it('listCheckpoints() returns array of checkpoints', async () => {
    agent._sessionId = 'test-session';
    agent._currentGoal = 'Test goal';

    // Save checkpoint
    await agent.saveCheckpoint();

    // List checkpoints
    const checkpoints = await AutonomousAgent.listCheckpoints();

    assert.ok(Array.isArray(checkpoints), 'listCheckpoints() should return an array');
    assert.ok(checkpoints.length >= 1, 'Should have at least one checkpoint');
  });

  it('listCheckpoints() returns empty array when no checkpoints', async () => {
    // List checkpoints before creating any
    const checkpoints = await AutonomousAgent.listCheckpoints();

    assert.ok(Array.isArray(checkpoints), 'listCheckpoints() should return an array');
    assert.equal(checkpoints.length, 0, 'Should have zero checkpoints when none created');
  });

  it('resumeFromCheckpoint() restores agent state', async () => {
    // Set up and save checkpoint
    agent._sessionId = 'resume-test-session';
    agent._currentGoal = 'Resume test goal';
    agent._currentPlan = { tasks: ['t1', 't2'] };
    agent._completedTasks = ['t1'];
    agent._learnings = ['learning1'];

    const checkpointId = await agent.saveCheckpoint();

    // Resume from checkpoint
    const resumedAgent = await AutonomousAgent.resumeFromCheckpoint(checkpointId);

    // Verify state restored
    assert.equal(resumedAgent._sessionId, 'resume-test-session');
    assert.equal(resumedAgent._currentGoal, 'Resume test goal');
    assert.deepEqual(resumedAgent._completedTasks, ['t1']);
  });

  it('resumeFromCheckpoint() throws on invalid ID', async () => {
    let error = null;
    try {
      await AutonomousAgent.resumeFromCheckpoint('nonexistent_chk_id');
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Should throw error for invalid checkpoint ID');
  });
});
