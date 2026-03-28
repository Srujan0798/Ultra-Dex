// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Validation Test
 * Validates the exact scenario from the task:
 * 1. Define a blocklist policy
 * 2. Attempt to execute a blocked tool
 * 3. Must be rejected
 * 4. Audit log must contain the denial record
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Validation - Blocklist Policy', () => {
  let orchestrator;
  let governance;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    // Mock the MCP server to avoid initialization issues
    orchestrator.mcpServer = {
      toolsMap: new Map(),
    };

    // Create a shared governance manager for this test suite
    governance = new GovernanceManager();
  });

  it('should define a blocklist policy and reject blocked tool execution', async () => {
    // 1. DEFINE A BLOCKLIST POLICY
    // Block the 'delete_database' tool as specified in the task
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database Tool',
      description: 'Block the delete_database tool for security',
      condition: (ctx) => !(ctx.action === 'tool:delete_database'),
      enforcement: 'block',
    });

    // 2. ADD THE TOOL TO THE ORCHESTRATOR
    const testToolName = 'delete_database';
    const testTool = {
      handler: mock.fn(async () => ({ success: true, deleted: true })),
    };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // 3. OVERRIDE THE GOVERNANCE INSTANCE USED BY THE ORCHESTRATOR
    const originalGovernanceManager = mock.fn(() => governance);
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // 4. ATTEMPT TO EXECUTE THE BLOCKED TOOL
    // 5. MUST BE REJECTED
    await assert.rejects(
      async () => await orchestrator.executeTool(testToolName, { force: true }),
      GovernanceDeniedException
    );

    // 6. AUDIT LOG MUST CONTAIN THE DENIAL RECORD
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'blocked');
    assert.strictEqual(auditEntries[0].agentId, 'orchestrator');
    assert.strictEqual(auditEntries[0].resource, testToolName);
  });

  it('should allow execution of non-blocked tools', async () => {
    // Add a policy that only blocks delete_database
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database Tool',
      description: 'Block the delete_database tool for security',
      condition: (ctx) => !(ctx.action === 'tool:delete_database'),
      enforcement: 'block',
    });

    // Add a tool that should be allowed
    const testToolName = 'read_file';
    const testTool = {
      handler: mock.fn(async () => ({ content: 'file content' })),
    };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Override the governance instance
    const originalGovernanceManager = mock.fn(() => governance);
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Execute the allowed tool - should succeed
    const result = await orchestrator.executeTool(testToolName, { path: '/tmp/test.txt' });

    // Verify it succeeded
    assert.strictEqual(result.content, 'file content');

    // Verify audit log shows it was allowed
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'allowed');
  });
});
