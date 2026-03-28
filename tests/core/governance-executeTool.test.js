// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Integration Test for executeTool function
 * Tests that executeTool calls governance.authorize() before tool.handler()
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock the AI meta layer to avoid dependency issues
mock('../src/core/ai/ai-meta-layer.js', () => ({
  aiMetaLayer: {
    call: mock.fn(async () => ({ text: 'mock response' })),
  },
}));

// Mock the self healing module
mock('../src/core/reliability/self-healing.js', () => ({
  selfHealing: {
    start: mock.fn(async () => {}),
    reportAgentError: mock.fn(async () => {}),
  },
}));

// Mock the memory manager
mock('../src/core/memory/manager.js', () => ({
  ppmManager: {
    init: mock.fn(async () => {}),
    search: mock.fn(async () => []),
    add: mock.fn(async () => {}),
  },
}));

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

  it('executeTool should call governance.authorize() before tool.handler()', async () => {
    // Arrange: Add a tool that we'll allow
    const testToolName = 'test-tool';
    const testToolHandler = mock.fn(async () => 'tool success');
    const testTool = { handler: testToolHandler };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Create a governance manager that allows the action
    const governance = new GovernanceManager();
    // Don't add any blocking policies, so it should allow by default

    // Override the governance instance used by the orchestrator
    const originalGovernanceManager = mock.fn(() => governance);
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act: Execute the tool
    const result = await orchestrator.executeTool(testToolName, { param: 'value' });

    // Assert: The tool handler was called (governance allowed it)
    assert.strictEqual(testToolHandler.mock.callCount, 1);
    assert.strictEqual(result, 'tool success');

    // Assert: Audit log should contain the allowance record
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'allowed');
  });

  it('executeTool should block denied operations via governance', async () => {
    // Arrange: Add a tool that we'll block
    const testToolName = 'blocked-tool';
    const testToolHandler = mock.fn(); // Should not be called
    const testTool = { handler: testToolHandler };
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
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act & Assert: Attempt to execute the blocked tool should throw
    await assert.rejects(
      async () => await orchestrator.executeTool(testToolName, {}),
      GovernanceDeniedException
    );

    // Assert: The tool handler was NOT called (governance blocked it)
    assert.strictEqual(testToolHandler.mock.callCount, 0);

    // Assert: Audit log should contain the denial record
    const auditEntries = governance.audit.query({ action: `tool:${testToolName}` });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'blocked');
  });
});
