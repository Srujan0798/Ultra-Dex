/**
 * Autonomous Loop Integration Test
 * End-to-end test for the full autonomous agent workflow
 * 
 * @module tests/integration/autonomous-integration.test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { BaseAgent } from '../../src/core/agents/base-agent.js';
import { Coordinator } from '../../src/core/agents/coordinator.js';
import { MemoryManager } from '../../src/core/memory/manager.js';

describe('Autonomous Integration Tests', () => {
    let coordinator;
    let agent;
    let memoryManager;

    before(async () => {
        // Initialize components
        coordinator = new Coordinator();
        agent = new BaseAgent('test-autonomous-agent', { 
            capabilities: ['test'] // Add test capability
        });
        memoryManager = new MemoryManager();
        
        await coordinator.initialize();
        await agent.initialize();
    });

    after(async () => {
        // Cleanup
        if (agent) await agent.shutdown();
        if (coordinator) coordinator.removeAllListeners();
    });

    it('should initialize autonomous components', async () => {
        assert.ok(coordinator, 'Coordinator should be initialized');
        assert.ok(agent, 'Agent should be initialized');
        assert.ok(memoryManager, 'Memory manager should be initialized');
    });

    it('should register agent with coordinator', async () => {
        coordinator.registerAgent(agent);
        assert.strictEqual(coordinator.agents.size, 1, 'Agent should be registered');
    });

    it('should handle basic task execution', async () => {
        const testTask = {
            id: 'test-task-autonomous',
            type: 'test',
            description: 'Test autonomous execution',
            data: { test: true }
        };

        // Override the onExecute method for testing
        agent.onExecute = async (task) => {
            return { success: true, task: task.id, result: 'processed' };
        };

        const result = await agent.execute(testTask);
        assert.ok(result.success, 'Task should execute successfully');
        assert.strictEqual(result.task, testTask.id, 'Task ID should match');
    });

    it('should coordinate multiple agents', async () => {
        const agent2 = new BaseAgent('test-agent-2', { capabilities: ['test'] });
        await agent2.initialize();
        
        coordinator.registerAgent(agent2);
        assert.strictEqual(coordinator.agents.size, 2, 'Both agents should be registered');
        
        await agent2.shutdown();
    });

    it('should handle workflow execution', async () => {
        const workflow = {
            tasks: [
                {
                    id: 'workflow-task-1',
                    type: 'test',
                    description: 'First task in workflow'
                }
            ],
            strategy: 'sequential'
        };

        // Mock agent processing
        for (const agent of coordinator.agents.values()) {
            agent.process = async (task) => ({ success: true, task: task.id });
        }

        const result = await coordinator.executeWorkflow(workflow);
        assert.ok(Array.isArray(result), 'Workflow should return results array');
        assert.strictEqual(result.length, 1, 'Should process one task');
    });
});
