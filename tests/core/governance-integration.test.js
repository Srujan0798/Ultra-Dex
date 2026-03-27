// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Integration Tests
 * Validates that GovernanceManager is properly integrated with executeTool() and executeTask()
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

describe('Governance Integration', () => {
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
      handler: mock.fn().mockResolvedValue('success'),
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
    // We'll do this by mocking the GovernanceManager constructor
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

  it('executeTask should block denied operations via governance', async () => {
    // Arrange: Mock the AI layer to avoid complex setup
    const mockAi = {
      call: mock.fn().mockResolvedValue({ text: 'task output' }),
    };
    orchestrator.getAiLayer = mock.fn().mockResolvedValue(mockAi);
    orchestrator.memory = {
      search: mock.fn().mockResolvedValue([]),
      add: mock.fn().mockResolvedValue(),
    };
    orchestrator.registry = {
      getAgentPrompt: mock.fn().mockResolvedValue('system prompt'),
    };

    // Create a governance manager and add a block policy for task execution
    const governance = new GovernanceManager();
    governance.policies.addPolicy({
      id: 'block-task-execution',
      name: 'Block Task Execution',
      description: 'Block task execution for validation',
      condition: (ctx) => !(ctx.action === 'executeTask'),
      enforcement: 'block',
    });

    // Override the governance instance used by the orchestrator
    const originalGovernanceManager = mock.fn(() => governance);
    mock('../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act & Assert: Attempt to execute a task
    await assert.rejects(
      async () => await orchestrator.executeTask('test task'),
      GovernanceDeniedException
    );

    // Assert: Audit log should contain the denial record
    const auditEntries = governance.audit.query({ action: 'executeTask' });
    assert.strictEqual(auditEntries.length, 1);
    assert.strictEqual(auditEntries[0].outcome, 'blocked');
  });
});
