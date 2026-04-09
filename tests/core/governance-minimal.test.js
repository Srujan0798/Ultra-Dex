// Copyright (c) 2026 Ultra-Dex
/**
 * Minimal Governance Test - Tests executeTool governance integration without AI dependencies
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

// We'll test the governance logic directly without initializing the full orchestrator
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

const TEST_DB_PATH = path.join('/tmp', '.ultra-dex-test', 'audit', 'governance-minimal.db');

function safeCleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  } catch {
    /* ignore cleanup errors */
  }
}

describe('Governance Integration - Minimal executeTool Test', () => {
  let governance;

  beforeEach(() => {
    safeCleanup(TEST_DB_PATH);
    governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });
  });

  it('should block tool execution when policy denies it', async () => {
    // Arrange: Add a policy that blocks a specific tool
    governance.policies.addPolicy({
      id: 'block-dangerous-tool',
      name: 'Block Dangerous Tool',
      description: 'Blocks the dangerous tool',
      condition: (ctx) => !(ctx.action === 'tool:dangerous_tool'),
      enforcement: 'block',
    });

    // Act: Try to execute the blocked tool through governance
    const context = {
      agentId: 'test-agent',
      action: 'tool:dangerous_tool',
      resource: 'dangerous_tool',
      details: { toolName: 'dangerous_tool', args: {} },
    };

    const result = await governance.gate(context);

    // Assert: Should be blocked
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'policy-violation');
  });

  it('should allow tool execution when policy permits it', async () => {
    // Arrange: Add a policy that allows the tool (condition returns true)
    governance.policies.addPolicy({
      id: 'allow-safe-tool',
      name: 'Allow Safe Tool',
      description: 'Allows the safe tool',
      condition: (ctx) => ctx.action === 'tool:safe_tool',
      enforcement: 'block',
    });

    // Act: Try to execute the allowed tool through governance
    const context = {
      agentId: 'test-agent',
      action: 'tool:safe_tool',
      resource: 'safe_tool',
      details: { toolName: 'safe_tool', args: {} },
    };

    const result = await governance.gate(context);

    // Assert: Should be allowed
    assert.strictEqual(result.allowed, true);
  });

  it('should record audit entries for both allowed and blocked actions', async () => {
    // Arrange: Add a blocking policy
    governance.policies.addPolicy({
      id: 'block-test-tool',
      name: 'Block Test Tool',
      description: 'Blocks the test tool',
      condition: (ctx) => !(ctx.action === 'tool:test_tool'),
      enforcement: 'block',
    });

    // Act: Test blocked action
    const blockedContext = {
      agentId: 'test-agent',
      action: 'tool:test_tool',
      resource: 'test_tool',
      details: { toolName: 'test_tool', args: {} },
    };
    await governance.gate(blockedContext);

    // Act: Test allowed action (by using a different action that doesn't match the block condition)
    const allowedContext = {
      agentId: 'test-agent',
      action: 'tool:other_tool',
      resource: 'other_tool',
      details: { toolName: 'other_tool', args: {} },
    };
    await governance.gate(allowedContext);

    // Assert: Audit log should have both entries
    const blockedAudit = await governance.audit.query({ action: 'tool:test_tool' });
    assert.strictEqual(blockedAudit.length, 1);
    assert.strictEqual(blockedAudit[0].outcome, 'blocked');

    const allowedAudit = await governance.audit.query({ action: 'tool:other_tool' });
    assert.strictEqual(allowedAudit.length, 1);
    assert.strictEqual(allowedAudit[0].outcome, 'allowed');
  });
});
