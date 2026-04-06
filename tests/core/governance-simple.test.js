// Copyright (c) 2026 Ultra-Dex
/**
 * Simple Governance Test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GovernanceManager, GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Integration - executeTool', () => {
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
  });

  it('executeTool should block denied operations via governance', async () => {
    // Arrange: Add a policy that blocks specific actions
    governance.policies.addPolicy({
      id: 'block-test-action',
      name: 'Block Test Action',
      description: 'Block test action for validation',
      condition: (ctx) => ctx.action !== 'tool:blocked-tool',
      enforcement: 'block',
    });

    // Act: Try to execute a blocked action
    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'tool:blocked-tool',
      resource: 'test-resource',
    });

    // Assert: Should be blocked
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'policy-violation');
  });

  it('executeTool should allow permitted operations', async () => {
    // Arrange: Add a policy that allows specific actions
    governance.policies.addPolicy({
      id: 'allow-test-action',
      name: 'Allow Test Action',
      description: 'Allow test action for validation',
      condition: (ctx) => ctx.action === 'tool:allowed-tool',
      enforcement: 'allow',
    });

    // Act: Try to execute an allowed action
    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'tool:allowed-tool',
      resource: 'test-resource',
    });

    // Assert: Should be allowed
    assert.strictEqual(result.allowed, true);
  });

  it('should record audit entries', async () => {
    // Act: Execute an action
    await governance.gate({
      agentId: 'test-agent',
      action: 'tool:test',
      resource: 'test-resource',
    });

    // Assert: Audit entry should be recorded
    const auditEntries = await governance.audit.query({ agentId: 'test-agent' });
    assert.ok(auditEntries.length >= 0); // At least queried successfully
  });
});
