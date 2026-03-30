// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Integration Test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';

describe('Governance Integration', () => {
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
  });

  it('should gate operations correctly', async () => {
    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'execute',
      resource: 'test-resource',
    });

    assert.strictEqual(result.allowed, true);
  });

  it('should handle multiple policies', async () => {
    governance.policies.addPolicy({
      id: 'policy-1',
      name: 'Policy 1',
      condition: (ctx) => ctx.agentId === 'test-agent',
      enforcement: 'allow',
    });

    governance.policies.addPolicy({
      id: 'policy-2',
      name: 'Policy 2',
      condition: (ctx) => ctx.action !== 'blocked',
      enforcement: 'block',
    });

    const allowedResult = await governance.gate({
      agentId: 'test-agent',
      action: 'execute',
    });

    assert.strictEqual(allowedResult.allowed, true);

    const blockedResult = await governance.gate({
      agentId: 'test-agent',
      action: 'blocked',
    });

    assert.strictEqual(blockedResult.allowed, false);
  });

  it('should track audit records', async () => {
    await governance.gate({
      agentId: 'agent-1',
      action: 'action-1',
    });

    await governance.gate({
      agentId: 'agent-2',
      action: 'action-2',
    });

    const allEntries = governance.audit.query();
    assert.ok(allEntries.length >= 2);

    const agent1Entries = governance.audit.query({ agentId: 'agent-1' });
    assert.ok(agent1Entries.length >= 1);
  });
});
