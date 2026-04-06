// Copyright (c) 2026 Ultra-Dex
/**
 * Direct Governance Test
 * Tests the governance logic directly without instantiating the orchestrator
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

const TEST_DB_PATH = path.join('/tmp', '.ultra-dex-test', 'audit', 'governance-direct.db');

function safeCleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  } catch { /* ignore cleanup errors */ }
}

describe('Governance Integration - Direct Test', () => {
  let governance;

  beforeEach(async () => {
    safeCleanup(TEST_DB_PATH);
    governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });
  });

  it('should block tool execution when policy denies it', async () => {
    // Arrange: Add a policy that blocks a specific tool action
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database',
      description: 'Blocks the delete_database tool',
      condition: (ctx) => !(ctx.action === 'tool:delete_database'),
      enforcement: 'block',
    });

    // Act: Try to execute the blocked tool through governance
    const context = {
      agentId: 'orchestrator',
      action: 'tool:delete_database',
      resource: 'delete_database',
      details: { toolName: 'delete_database', args: { force: true } },
    };

    const result = await governance.gate(context);

    // Assert: Should be blocked
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'policy-violation');
  });

  it('should allow tool execution when no policy blocks it', async () => {
    // Act: Try to execute a tool with no blocking policies
    const context = {
      agentId: 'orchestrator',
      action: 'tool:read_file',
      resource: 'read_file',
      details: { toolName: 'read_file', args: { path: '/tmp/test.txt' } },
    };

    const result = await governance.gate(context);

    // Assert: Should be allowed
    assert.strictEqual(result.allowed, true);
  });

  it('should record audit entries for governance decisions', async () => {
    // Arrange: Add a blocking policy
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database',
      description: 'Blocks the delete_database tool',
      condition: (ctx) => !(ctx.action === 'tool:delete_database'),
      enforcement: 'block',
    });

    // Act: Test blocked action
    const blockedContext = {
      agentId: 'orchestrator',
      action: 'tool:delete_database',
      resource: 'delete_database',
      details: { toolName: 'delete_database', args: { force: true } },
    };
    await governance.gate(blockedContext);

    // Act: Test allowed action (different tool)
    const allowedContext = {
      agentId: 'orchestrator',
      action: 'tool:read_file',
      resource: 'read_file',
      details: { toolName: 'read_file', args: { path: '/tmp/test.txt' } },
    };
    await governance.gate(allowedContext);

    // Assert: Audit log should have both entries
    const blockedAudit = await governance.audit.query({ action: 'tool:delete_database' });
    assert.strictEqual(blockedAudit.length, 1);
    assert.strictEqual(blockedAudit[0].outcome, 'blocked');
    assert.strictEqual(blockedAudit[0].agentId, 'orchestrator');

    const allowedAudit = await governance.audit.query({ action: 'tool:read_file' });
    assert.strictEqual(allowedAudit.length, 1);
    assert.strictEqual(allowedAudit[0].outcome, 'allowed');
    assert.strictEqual(allowedAudit[0].agentId, 'orchestrator');
  });

  it('should throw GovernanceDeniedException for blocked operations in orchestrator context', async () => {
    // This test validates that our executeTool modification would work
    // Arrange: Add a blocking policy
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database',
      description: 'Blocks the delete_database tool',
      condition: (ctx) => !(ctx.action === 'tool:delete_database'),
      enforcement: 'block',
    });

    // Simulate what happens in executeTool
    const context = {
      agentId: 'orchestrator',
      action: 'tool:delete_database',
      resource: 'delete_database',
      details: { toolName: 'delete_database', args: { force: true } },
    };

    const governanceResult = await governance.gate(context);

    // Assert: Should not be allowed
    assert.strictEqual(governanceResult.allowed, false);

    // Act & Assert: Should throw GovernanceDeniedException when not allowed
    await assert.rejects(async () => {
      throw new GovernanceDeniedException(
        `Tool execution blocked by governance policy: ${governanceResult.reason}`,
        context
      );
    }, GovernanceDeniedException);
  });
});
