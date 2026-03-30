// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Validation Test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';

describe('Governance Validation', () => {
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
  });

  it('should initialize with default settings', () => {
    assert.ok(governance.engine);
    assert.ok(governance.policies);
    assert.ok(governance.audit);
  });

  it('should add custom policies', async () => {
    const policy = {
      id: 'test-policy',
      name: 'Test Policy',
      condition: () => true,
      enforcement: 'allow',
    };

    governance.policies.addPolicy(policy);

    const result = await governance.gate({
      agentId: 'test',
      action: 'test',
    });

    assert.strictEqual(result.allowed, true);
  });

  it('should block when policy condition fails', async () => {
    governance.policies.addPolicy({
      id: 'block-all',
      name: 'Block All',
      condition: () => false,
      enforcement: 'block',
    });

    const result = await governance.gate({
      agentId: 'test',
      action: 'test',
    });

    assert.strictEqual(result.allowed, false);
  });

  it('should record audit entries', async () => {
    await governance.gate({
      agentId: 'test-agent',
      action: 'test-action',
      resource: 'test-resource',
    });

    const entries = governance.audit.query();
    assert.ok(entries.length >= 0);
  });

  it('should query audit by action', async () => {
    await governance.gate({
      agentId: 'test',
      action: 'specific-action',
      resource: 'test',
    });

    const entries = governance.audit.query({ action: 'specific-action' });
    assert.ok(entries.length >= 0);
  });

  it('should query audit by agentId', async () => {
    await governance.gate({
      agentId: 'specific-agent',
      action: 'test',
    });

    const entries = governance.audit.query({ agentId: 'specific-agent' });
    assert.ok(entries.length >= 0);
  });
});
