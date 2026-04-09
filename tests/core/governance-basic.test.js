// Copyright (c) 2026 Ultra-Dex
/**
 * Basic Governance Integration Test for executeTool only
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

const TEST_DB_PATH = path.join('/tmp', '.ultra-dex-test', 'audit', 'governance.db');

function safeCleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  } catch {
    /* ignore cleanup errors */
  }
}

describe('Governance Integration - executeTool Basic', () => {
  beforeEach(() => {
    safeCleanup(TEST_DB_PATH);
  });

  it('GovernanceManager should block operations based on policy', async () => {
    // Arrange: Create a governance manager and add a block policy
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });
    governance.policies.addPolicy({
      id: 'block-test-action',
      name: 'Block Test Action',
      description: 'Block test action for validation',
      condition: (ctx) => !(ctx.action === 'test-action'),
      enforcement: 'block',
    });

    // Act: Test the governance check
    const context = {
      agentId: 'test-agent',
      action: 'test-action',
      resource: 'test-resource',
      details: {},
    };

    const governanceResult = await governance.gate(context);

    // Assert: Action should be blocked
    assert.strictEqual(governanceResult.allowed, false);
    assert.strictEqual(governanceResult.reason, 'policy-violation');
  });

  it('GovernanceManager should allow operations when no policy blocks', async () => {
    // Arrange: Create a governance manager with no blocking policies
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    // Act: Test the governance check
    const context = {
      agentId: 'test-agent',
      action: 'test-action',
      resource: 'test-resource',
      details: {},
    };

    const governanceResult = await governance.gate(context);

    // Assert: Action should be allowed
    assert.strictEqual(governanceResult.allowed, true);
  });

  it('AuditTrail should record governance decisions', async () => {
    // Arrange: Create a governance manager
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });
    governance.policies.addPolicy({
      id: 'block-test-action',
      name: 'Block Test Action',
      description: 'Block test action for validation',
      condition: (ctx) => !(ctx.action === 'test-action'),
      enforcement: 'block',
    });

    // Act: Test a blocked action
    const context = {
      agentId: 'test-agent',
      action: 'test-action',
      resource: 'test-resource',
      details: {},
    };

    await governance.gate(context);

    // Assert: Audit log should contain the record
    const auditEntries = await governance.audit.query({ action: 'test-action' });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'blocked');
  });
});
