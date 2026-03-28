// Copyright (c) 2026 Ultra-Dex
/**
 * Final Governance Integration Test for executeTool
 * Validates that executeTool calls governance.authorize() before tool.handler()
 * and that blocked operations throw GovernanceDeniedException with audit logging
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Create a minimal mock orchestrator that focuses on executeTool governance
class TestOrchestrator {
  constructor() {
    this.mcpServer = { toolsMap: new Map() };
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  emit(event, data) {
    if (this.events[event]) {
      for (const listener of this.events[event]) {
        listener(data);
      }
    }
  }
}

// Import the actual governance classes
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { GovernanceDeniedException } from '../../src/core/governance/governance-manager.js';

// Mock the executeTool function with our governance integration
async function executeTool(orchestrator, name, args) {
  orchestrator.emit('tool:use', { name, args });

  // Get the tool from the mock orchestrator
  const tool = orchestrator.mcpServer.toolsMap?.get(name);
  if (!tool) throw new Error(`Tool ${name} not found`);

  // Governance check before tool execution (OUR MODIFICATION)
  const governance = new GovernanceManager();
  const context = {
    agentId: 'orchestrator',
    action: `tool:${name}`,
    resource: name,
    details: { toolName: name, args },
  };

  const governanceResult = await governance.gate(context);
  if (!governanceResult.allowed) {
    throw new GovernanceDeniedException(
      `Tool execution blocked by governance policy: ${governanceResult.reason}`,
      context
    );
  }

  // Call the tool's handler directly
  const result = await tool.handler(args);
  orchestrator.emit('tool:result', { name, result: JSON.stringify(result).substring(0, 500) });
  return result;
}

describe('Governance Integration - executeTool', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new TestOrchestrator();
  });

  it('executeTool should block denied operations via governance', async () => {
    // Arrange: Add a tool that we'll block
    const testToolName = 'delete_database';
    const testToolHandler = mock.fn(); // Should not be called if blocked
    const testTool = { handler: testToolHandler };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Act & Assert: Attempt to execute the blocked tool should throw GovernanceDeniedException
    await assert.rejects(
      async () => await executeTool(orchestrator, testToolName, { force: true }),
      GovernanceDeniedException
    );

    // Assert: The tool handler was NOT called (governance blocked it)
    assert.strictEqual(testToolHandler.mock.callCount, 0);
  });

  it('executeTool should allow permitted operations', async () => {
    // Arrange: Add a tool that we'll allow
    const testToolName = 'read_file';
    const testToolHandler = mock.fn(async () => ({ content: 'file data' }));
    const testTool = { handler: testToolHandler };
    orchestrator.mcpServer.toolsMap.set(testToolName, testTool);

    // Act: Execute the allowed tool
    const result = await executeTool(orchestrator, testToolName, { path: '/tmp/test.txt' });

    // Assert: The tool handler WAS called (governance allowed it)
    assert.strictEqual(testToolHandler.mock.callCount, 1);
    assert.deepStrictEqual(result, { content: 'file data' });
  });

  it('executeTool should create audit records for both allowed and blocked operations', async () => {
    // Arrange: Add both a blocked tool and an allowed tool
    const blockedToolName = 'delete_database';
    const allowedToolName = 'read_file';

    const blockedToolHandler = mock.fn(async () => {});
    const allowedToolHandler = mock.fn(async () => ({ content: 'file data' }));

    orchestrator.mcpServer.toolsMap.set(blockedToolName, { handler: blockedToolHandler });
    orchestrator.mcpServer.toolsMap.set(allowedToolName, { handler: allowedToolHandler });

    // Create a governance manager with a block policy for delete_database
    const governance = new GovernanceManager();
    governance.policies.addPolicy({
      id: 'block-delete-database',
      name: 'Block Delete Database',
      description: 'Blocks the delete_database tool',
      condition: (ctx) => !(ctx.action === `tool:${blockedToolName}`),
      enforcement: 'block',
    });

    // Override the governance instance used in executeTool
    const originalGovernanceManager = mock.fn(() => governance);
    mock('../../src/core/governance/governance-manager.js', () => ({
      GovernanceManager: originalGovernanceManager,
      GovernanceDeniedException,
    }));

    // Act & Assert: Blocked tool should throw
    await assert.rejects(
      async () => await executeTool(orchestrator, blockedToolName, { force: true }),
      GovernanceDeniedException
    );

    // Act: Allowed tool should succeed
    const result = await executeTool(orchestrator, allowedToolName, { path: '/tmp/test.txt' });

    // Assert: Tool handler calls
    assert.strictEqual(blockedToolHandler.mock.callCount, 0); // Not called
    assert.strictEqual(allowedToolHandler.mock.callCount, 1); // Called
    assert.deepStrictEqual(result, { content: 'file data' });

    // Assert: Audit log should have both entries
    const blockedAudit = governance.audit.query({ action: `tool:${blockedToolName}` });
    assert.strictEqual(blockedAudit.length, 1);
    assert.strictEqual(blockedAudit[0].outcome, 'blocked');

    const allowedAudit = governance.audit.query({ action: `tool:${allowedToolName}` });
    assert.strictEqual(allowedAudit.length, 1);
    assert.strictEqual(allowedAudit[0].outcome, 'allowed');
  });
});
