// Copyright (c) 2026 Ultra-Dex
/**
 * Simple Governance Integration Test for executeTool
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Integration - executeTool', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    // Mock the MCP server to avoid initialization issues
    orchestrator.mcpServer = {
      toolsMap: new Map(),
    };
  });

  it('executeTool should block denied operations via governance', async () => {
    // Arrange: Add a tool that we'll block
    const testToolName = 'test-tool';
    const testTool = {
      handler: mock.fn(async () => 'success'),
    };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Create a governance manager and add a block policy for our test tool
    const governance = new GovernanceManager();
    governance.policies.addPolicy({
      id: 'block-test-tool',
      name: 'Block Test Tool',
      description: 'Block the test tool for validation',
      condition: (ctx) => !(ctx.action === `tool:${testToolName}`),
      enforcement: 'block',
    });

    // Override the governance instance used by the orchestrator
    const originalGovernanceManager = mock.fn(() => governance);

    // Temporarily replace the GovernanceManager
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act & Assert: Attempt to execute the blocked tool
    await assert.rejects(
      async () => await orchestrator.executeTool(testToolName, {}),
      GovernanceDeniedException
    );

    // Assert: Audit log should contain the denial record
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'blocked');
  });

  it('executeTool should allow permitted operations', async () => {
    // Arrange: Add a tool that we'll allow
    const testToolName = 'allowed-tool';
    const testTool = {
      handler: mock.fn(async () => 'success'),
    };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Create a governance manager with no blocking policies
    const governance = new GovernanceManager();

    // Override the governance instance used by the orchestrator
    const originalGovernanceManager = mock.fn(() => governance);

    // Temporarily replace the GovernanceManager
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act: Execute the allowed tool
    const result = await orchestrator.executeTool(testToolName, {});

    // Assert: Tool should execute successfully
    assert.strictEqual(result, 'success');

    // Assert: Audit log should contain the allowance record
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'allowed');
  });
});
