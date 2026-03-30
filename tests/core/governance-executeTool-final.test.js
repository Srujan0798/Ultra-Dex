// Copyright (c) 2026 Ultra-Dex
/**
 * Governance executeTool Final Test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';

describe('Governance Integration - executeTool Basic', () => {
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
  });

  it('should allow operations by default', async () => {
    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'tool:test',
      resource: 'test-resource',
    });

    assert.strictEqual(result.allowed, true);
  });

  it('should block operations with blocking policy', async () => {
    governance.policies.addPolicy({
      id: 'block-all',
      name: 'Block All Policy',
      condition: () => false,
      enforcement: 'block',
    });

    const result = await governance.gate({
      agentId: 'test-agent',
      action: 'tool:test',
    });

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'policy-violation');
  });

  it('should handle context properly', async () => {
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
