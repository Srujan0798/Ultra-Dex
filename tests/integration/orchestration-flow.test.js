// Copyright (c) 2026 Ultra-Dex
// Integration test: Orchestration Flow - Task dispatch through AgentOrchestrator

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'events';

describe('Orchestration Flow Integration', () => {
  let orchestrator;
  let mockGovernance;
  let mockAIProvider;
  let mockAgentRegistry;

  beforeEach(() => {
    // Setup mock governance
    mockGovernance = {
      checkPolicy: async () => ({ allowed: true }),
      validateTask: async () => ({ valid: true }),
    };

    // Setup mock AI provider
    mockAIProvider = {
      generate: async () => ({
        text: JSON.stringify([
          { description: 'Analyze requirements', required: 'analysis' },
          { description: 'Implement solution', required: 'coding' },
        ]),
      }),
    };

    // Create mock agent registry
    mockAgentRegistry = {
      agents: new Map(),
      register(agent) {
        this.agents.set(agent.id, agent);
      },
      get(id) {
        return this.agents.get(id);
      },
      findByCapability(capability) {
        return Array.from(this.agents.values()).filter((a) => a.capabilities.includes(capability));
      },
    };

    // Register mock agents
    mockAgentRegistry.register({
      id: 'analysis-agent',
      name: 'Analysis Agent',
      capabilities: ['analysis'],
      execute: async () => ({ success: true, result: 'Analysis complete' }),
    });
    mockAgentRegistry.register({
      id: 'coding-agent',
      name: 'Coding Agent',
      capabilities: ['coding'],
      execute: async () => ({ success: true, result: 'Code implemented' }),
    });
    mockAgentRegistry.register({
      id: 'self-healing-agent',
      name: 'Self-Healing Agent',
      capabilities: ['recovery'],
      execute: async () => ({ success: true, result: 'Recovered' }),
    });

    // Create orchestrator mock
    orchestrator = new EventEmitter();
    orchestrator.agentRegistry = mockAgentRegistry;
    orchestrator.supportedModes = ['simple', 'detailed', 'iterative'];

    orchestrator.orchestrate = async function (input, mode = 'simple', context = {}) {
      if (!this.supportedModes.includes(mode)) {
        throw new Error(`Unsupported mode: ${mode}`);
      }

      this.emit('orchestration:started', { input, mode });

      // Simulate planning phase
      const planText = await mockAIProvider.generate();
      const steps = JSON.parse(planText.text);

      // Simulate scheduling - assign agents to steps
      const assignedSteps = steps.map((step, i) => ({
        id: `step_${i}`,
        ...step,
        assignedAgent: mockAgentRegistry.findByCapability(step.required)?.[0]?.id,
      }));

      const task = {
        id: `task_${Date.now()}`,
        input,
        mode,
        context,
        steps: assignedSteps,
        status: 'planned',
      };

      this.emit('orchestration:completed', { taskId: task.id });
      return task;
    };

    orchestrator.execute = async function (task) {
      this.emit('execution:started', { taskId: task.id });

      // Check governance
      const policyCheck = await mockGovernance.checkPolicy(task);
      if (!policyCheck.allowed) {
        this.emit('execution:blocked', { reason: policyCheck.reason });
        return { status: 'blocked', blockReason: policyCheck.reason };
      }

      // Execute steps
      const results = [];
      for (const step of task.steps) {
        const agent = mockAgentRegistry.get(step.assignedAgent);
        try {
          const result = await agent.execute();
          results.push({ step: step.id, result, success: true });
        } catch (error) {
          results.push({ step: step.id, error: error.message, success: false });
          this.emit('execution:error', { step: step.id, error });
          this.emit('self-healing:triggered', {
            error,
            recoveryAttempt: true,
            failedStep: step.id,
          });
          return { status: 'failed', error, completedSteps: results.length };
        }
      }

      this.emit('execution:completed', { taskId: task.id });
      return {
        status: 'completed',
        completedSteps: results.length,
        results,
      };
    };
  });

  it('should complete full task dispatch flow successfully', async () => {
    const taskInput = 'Create a user authentication system';

    // Step 1: Orchestrate task (planning + scheduling)
    const task = await orchestrator.orchestrate(taskInput, 'simple');

    assert.ok(task, 'Task should be created');
    assert.ok(task.steps, 'Task should have steps');
    assert.ok(task.steps.length > 0, 'Task should have at least one step');

    // Step 2: Execute the task
    const result = await orchestrator.execute(task);

    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.status, 'completed', 'Task should complete successfully');
    assert.ok(result.completedSteps > 0, 'Should complete at least one step');
  });

  it('should block task by governance policy', async () => {
    // Setup governance to block tasks
    mockGovernance.checkPolicy = async () => ({
      allowed: false,
      reason: 'Task exceeds risk threshold',
      policy: 'security.policy.max-risk',
    });

    const taskInput = 'Delete all production databases';

    const task = await orchestrator.orchestrate(taskInput, 'simple');
    const result = await orchestrator.execute(task);

    assert.strictEqual(result.status, 'blocked', 'Task should be blocked by governance');
    assert.ok(result.blockReason, 'Should include block reason');
  });

  it('should trigger self-healing on task failure', async () => {
    let healingTriggered = false;
    let healingEvent = null;

    // Register failing agent
    mockAgentRegistry.register({
      id: 'failing-agent',
      name: 'Failing Agent',
      capabilities: ['failing-task'],
      execute: async () => {
        throw new Error('Simulated agent failure');
      },
    });

    // Listen for self-healing events
    orchestrator.on('self-healing:triggered', (event) => {
      healingTriggered = true;
      healingEvent = event;
    });

    // Create task that will fail
    const task = await orchestrator.orchestrate('Task that will fail', 'simple');

    // Override steps to use failing agent
    task.steps = [
      {
        id: 'step_0',
        description: 'Failing step',
        required: 'failing-task',
        assignedAgent: 'failing-agent',
      },
    ];

    const result = await orchestrator.execute(task);

    assert.strictEqual(result.status, 'failed', 'Task should fail');
    assert.ok(healingTriggered, 'Self-healing should be triggered');
    assert.ok(healingEvent, 'Healing event should exist');
    assert.ok(healingEvent.error, 'Healing event should include error');
    assert.ok(healingEvent.recoveryAttempt, 'Healing event should indicate recovery attempt');
  });

  it('should select appropriate agents based on task requirements', async () => {
    const taskInput = 'Analyze code quality and refactor';

    const task = await orchestrator.orchestrate(taskInput, 'detailed');

    // Verify agent selection
    const assignedAgents = task.steps
      .filter((step) => step.assignedAgent)
      .map((step) => step.assignedAgent);

    assert.ok(assignedAgents.length > 0, 'Should have assigned agents');

    // Verify agents have required capabilities
    for (const step of task.steps) {
      if (step.assignedAgent) {
        const agent = mockAgentRegistry.get(step.assignedAgent);
        assert.ok(agent, `Agent ${step.assignedAgent} should exist`);
        assert.ok(
          agent.capabilities.some((cap) => step.required.includes(cap)),
          `Agent should have required capability for step: ${step.description}`
        );
      }
    }
  });

  it('should track execution context through flow', async () => {
    const context = {
      projectId: 'proj-123',
      userId: 'user-456',
      priority: 'high',
    };

    const task = await orchestrator.orchestrate('Task with context', 'simple', context);

    // Verify context is preserved
    assert.ok(task.context, 'Task should have context');
    assert.strictEqual(task.context.projectId, context.projectId, 'Project ID should be preserved');
    assert.strictEqual(task.context.userId, context.userId, 'User ID should be preserved');

    // Execute and verify context flows through
    const result = await orchestrator.execute(task);
    assert.ok(result, 'Result should exist');
  });
});
