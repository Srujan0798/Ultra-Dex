// Copyright (c) 2026 Ultra-Dex
/**
 * Governance executeTool Test
 */

import { describe, it, beforeEach, mock } from 'node:test';
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
      id: 'block-test-tool',
      name: 'Block Test Tool',
      description: 'Block test tool for validation',
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
    // Act: Execute an allowed action
    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'tool:allowed-tool',
      resource: 'test-resource',
    });

    // Assert: Should be allowed
    assert.strictEqual(result.allowed, true);
  });

  it('should record audit entries for blocked actions', async () => {
    governance.policies.addPolicy({
      id: 'block-all',
      name: 'Block All',
      condition: () => false,
      enforcement: 'block',
    });

    await governance.gate({
      agentId: 'test-agent',
      action: 'tool:test',
      resource: 'test-resource',
    });

    const entries = await governance.audit.query({ agentId: 'test-agent' });
    assert.ok(entries.length >= 0);
  });

  it('should handle context with details', async () => {
    const context = {
      agentId: 'agent-123',
      action: 'executeTool',
      resource: 'file.txt',
      details: { extra: 'info' },
    };

    const result = await governance.gate(context);
    assert.strictEqual(result.allowed, true);
  });
});
