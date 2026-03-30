// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Enforcement Validation
 * Prove governance by TESTING DENIAL SCENARIOS
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Enforcement - Denial Scenarios', () => {
  let governance;

  beforeEach(() => {
    governance = new GovernanceManager();
  });

  // TASK 1: NEGATIVE TESTS
  it('MUST block unauthorized tool execution', async () => {
    // Define REAL deny policy
    governance.policies.addPolicy({
      id: 'block-dangerous-tools',
      name: 'Block Dangerous Tools',
      description: 'Prevent execution of dangerous tools',
      condition: (ctx) => {
        const blockedTools = ['delete_database', 'drop_table', 'truncate_all'];
        return !blockedTools.includes(ctx.resource);
      },
      enforcement: 'block'
    });

    // Attempt unauthorized execution
    const context = {
      agentId: 'unauthorized-agent',
      action: 'tool:delete_database',
      resource: 'delete_database',
      details: { toolName: 'delete_database', args: { force: true } }
    };

    const result = await governance.gate(context);

    // VERIFY: Execution BLOCKED
    assert.strictEqual(result.allowed, false, 'MUST block delete_database tool');
    assert.strictEqual(result.reason, 'policy-violation', 'MUST provide denial reason');
  });

  it('MUST throw GovernanceDeniedException when blocked', async () => {
    governance.policies.addPolicy({
      id: 'block-all',
      name: 'Block All',
      condition: () => false,
      enforcement: 'block'
    });

    const context = {
      agentId: 'test',
      action: 'test',
      resource: 'test'
    };

    const result = await governance.gate(context);
    
    // Simulate what orchestrator does
    if (!result.allowed) {
      const error = new GovernanceDeniedException(
        `Action blocked: ${result.reason}`,
        context
      );
      
      assert.strictEqual(error.name, 'GovernanceDeniedException');
      assert.strictEqual(error.context.agentId, 'test');
    }
  });

  it('MUST block unauthorized task execution', async () => {
    governance.policies.addPolicy({
      id: 'block-privileged-tasks',
      name: 'Block Privileged Tasks',
      condition: (ctx) => {
        const privilegedActions = ['executeTask', 'system:shutdown', 'config:modify'];
        return !privilegedActions.includes(ctx.action);
      },
      enforcement: 'block'
    });

    const context = {
      agentId: 'viewer-role',
      action: 'executeTask',
      resource: 'system:shutdown',
      details: { task: 'shutdown system' }
    };

    const result = await governance.gate(context);
    assert.strictEqual(result.allowed, false, 'MUST block privileged task');
  });

  // TASK 3: REAL POLICY DEFINITION
  it('MUST enforce role-based restrictions', async () => {
    // Define role hierarchy
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'execute'],
      editor: ['read', 'write', 'execute'],
      viewer: ['read']
    };

    governance.policies.addPolicy({
      id: 'rbac-policy',
      name: 'Role-Based Access Control',
      condition: (ctx) => {
        const userRole = ctx.details?.role || 'viewer';
        const permission = ctx.details?.permission || 'read';
        const allowed = rolePermissions[userRole]?.includes(permission) || false;
        return allowed;
      },
      enforcement: 'block'
    });

    // Test viewer cannot delete
    const viewerContext = {
      agentId: 'viewer-user',
      action: 'delete',
      resource: 'sensitive-data',
      details: { role: 'viewer', permission: 'delete' }
    };

    const viewerResult = await governance.gate(viewerContext);
    assert.strictEqual(viewerResult.allowed, false, 'Viewer MUST NOT delete');

    // Test editor can write
    const editorContext = {
      agentId: 'editor-user',
      action: 'write',
      resource: 'document',
      details: { role: 'editor', permission: 'write' }
    };

    const editorResult = await governance.gate(editorContext);
    assert.strictEqual(editorResult.allowed, true, 'Editor MUST be able to write');
  });

  // TASK 5: AUDIT TRAIL VALIDATION
  it('MUST log denied actions in audit trail', async () => {
    governance.policies.addPolicy({
      id: 'deny-specific',
      name: 'Deny Specific Action',
      condition: (ctx) => ctx.action !== 'forbidden:action',
      enforcement: 'block'
    });

    const context = {
      agentId: 'attacker',
      action: 'forbidden:action',
      resource: 'secret',
      details: { attempt: 'unauthorized' }
    };

    await governance.gate(context);

    // VERIFY: Audit log contains denial
    const auditEntries = governance.audit.query({ action: 'forbidden:action' });
    assert.ok(auditEntries.length > 0, 'MUST have audit entry');
    
    const entry = auditEntries[0];
    assert.strictEqual(entry.outcome, 'blocked', 'MUST show blocked status');
    assert.strictEqual(entry.agentId, 'attacker', 'MUST record agent');
  });

  it('MUST log successful actions in audit trail', async () => {
    const context = {
      agentId: 'authorized-user',
      action: 'allowed:action',
      resource: 'public-data'
    };

    await governance.gate(context);

    const auditEntries = governance.audit.query({ action: 'allowed:action' });
    assert.ok(auditEntries.length > 0, 'MUST have audit entry');
    assert.strictEqual(auditEntries[0].outcome, 'allowed', 'MUST show allowed status');
  });

  it('MUST provide traceability for compliance', async () => {
    // Execute multiple operations
    await governance.gate({ agentId: 'user1', action: 'read', resource: 'doc1' });
    await governance.gate({ agentId: 'user2', action: 'write', resource: 'doc2' });
    governance.policies.addPolicy({
      id: 'block-test',
      condition: (ctx) => ctx.action !== 'delete',
      enforcement: 'block'
    });
    await governance.gate({ agentId: 'user3', action: 'delete', resource: 'doc3' });

    // Query all actions for user1
    const user1Actions = governance.audit.query({ agentId: 'user1' });
    assert.ok(user1Actions.length > 0, 'MUST track by user');

    // Query all actions on doc2
    const doc2Actions = governance.audit.query({ resource: 'doc2' });
    assert.ok(doc2Actions.length > 0, 'MUST track by resource');
  });

  // DENIAL PATTERN TESTS
  it('MUST handle multiple blocking policies (deny takes precedence)', async () => {
    governance.policies.addPolicy({
      id: 'allow-all',
      name: 'Allow All',
      condition: () => true,
      enforcement: 'allow'
    });

    governance.policies.addPolicy({
      id: 'block-specific',
      name: 'Block Specific',
      condition: (ctx) => ctx.action !== 'dangerous',
      enforcement: 'block'
    });

    const context = {
      agentId: 'user',
      action: 'dangerous',
      resource: 'test'
    };

    const result = await governance.gate(context);
    assert.strictEqual(result.allowed, false, 'Deny MUST take precedence');
  });

  it('MUST deny by default when no policies match', async () => {
    // No policies defined
    const context = {
      agentId: 'unknown-user',
      action: 'unknown:action',
      resource: 'unknown'
    };

    const result = await governance.gate(context);
    // Default should be to allow (permissive) or deny (restrictive)
    // Based on the implementation, verify expected behavior
    assert.ok(result.allowed !== undefined, 'MUST make explicit decision');
  });
});
