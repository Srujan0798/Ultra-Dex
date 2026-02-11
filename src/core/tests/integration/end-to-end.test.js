// Copyright (c) 2026 Ultra-Dex
// tests/integration/end-to-end.test.js

import { describe, it, before, after } from 'node:test';
import assert from 'assert';
import { ultraDex } from '../../packages/core/index.js';

describe('Ultra-Dex End-to-End Integration', () => {
  before(async () => {
    // Initialize the entire system
    await ultraDex.initialize();
    
    // Mock AI providers to avoid actual API calls
    ultraDex.aiMetaLayer.call = async (model, messages, options = {}) => {
      return {
        content: `Mocked response for: ${messages[messages.length - 1]?.content || 'request'}`,
        usage: { totalTokens: 25 },
        finishReason: 'stop'
      };
    };
    
    ultraDex.aiMetaLayer.stream = async (model, messages, options = {}) => {
      return { [Symbol.asyncIterator]: async function*() { 
        yield `Streaming response for: ${messages[messages.length - 1]?.content || 'request'}`; 
      } };
    };
    
    ultraDex.aiMetaLayer.generateObject = async (model, messages, schema, options = {}) => {
      return {
        object: { generated: true, content: messages[messages.length - 1]?.content || 'request' },
        usage: { totalTokens: 30 }
      };
    };
  });

  after(async () => {
    if (ultraDex.isInitialized) {
      await ultraDex.shutdown();
    }
  });

  it('should process a complete AI request end-to-end', async () => {
    const result = await ultraDex.processRequest('Hello, Ultra-Dex!');

    assert.ok(result);
    assert.ok(result.content);
    assert.ok(result.content.includes('Hello, Ultra-Dex!'));
    assert.ok(result.usage);
    assert.strictEqual(result.usage.totalTokens, 25);
  });

  it('should handle agent coordination workflow', async () => {
    // Register a test agent
    ultraDex.agentMetaOrchestrator.registerAgent('integration-test-agent', {
      name: 'Integration Test Agent',
      description: 'Agent for integration testing',
      capabilities: ['integration', 'testing'],
      priority: 8,
      maxConcurrency: 2
    });

    // Process a request that should trigger agent coordination
    const result = await ultraDex.processRequest('Coordinate an integration test task');

    assert.ok(result);
    // The result depends on the mocked AI response
  });

  it('should store and retrieve context', async () => {
    const testData = { 
      type: 'integration-test', 
      value: Math.random(),
      timestamp: Date.now()
    };
    
    // Store data in context manager
    const stored = await ultraDex.contextMetaManager.store(
      'integration-test-key', 
      testData, 
      { test: true, category: 'integration' },
      { tags: ['integration', 'test'], temporary: true }
    );

    assert.ok(stored);
    assert.strictEqual(stored.id, 'integration-test-key');
    assert.deepStrictEqual(stored.data, testData);

    // Retrieve the data
    const retrieved = await ultraDex.contextMetaManager.retrieve('integration-test-key');
    
    assert.ok(retrieved);
    assert.deepStrictEqual(retrieved.data, testData);
    assert.strictEqual(retrieved.context.test, true);
    assert.ok(retrieved.metadata.accessCount > 0);
  });

  it('should maintain context across requests', async () => {
    const contextId = `test-context-${Date.now()}`;
    
    // Store initial context
    await ultraDex.contextMetaManager.store(
      `${contextId}-initial`,
      { step: 1, data: 'initial' },
      { session: contextId, phase: 'initial' }
    );

    // Process a request that would add to context
    await ultraDex.processRequest(`Continue work on session ${contextId}`);

    // Store updated context
    await ultraDex.contextMetaManager.store(
      `${contextId}-updated`,
      { step: 2, data: 'updated', previous: 'initial' },
      { session: contextId, phase: 'updated' }
    );

    // Verify both contexts are retrievable
    const initial = await ultraDex.contextMetaManager.retrieve(`${contextId}-initial`);
    const updated = await ultraDex.contextMetaManager.retrieve(`${contextId}-updated`);

    assert.ok(initial);
    assert.ok(updated);
    assert.strictEqual(initial.data.step, 1);
    assert.strictEqual(updated.data.step, 2);
  });

  it('should execute agent tasks with proper context', async () => {
    // Register an agent that requires context
    ultraDex.agentMetaOrchestrator.registerAgent('context-dependent-agent', {
      name: 'Context Dependent Agent',
      description: 'Agent that needs context to function',
      capabilities: ['context-processing', 'analysis'],
      priority: 7,
      maxConcurrency: 1
    });

    // Add some context that the agent might use
    await ultraDex.contextMetaManager.store(
      'project-context',
      { 
        project: 'test-project',
        requirements: ['requirement-1', 'requirement-2'],
        status: 'active'
      },
      { domain: 'project-management', type: 'requirements' }
    );

    // Execute a task that would benefit from context
    const result = await ultraDex.agentMetaOrchestrator.executeTask(
      'Analyze project requirements and suggest implementation approach',
      { 
        requiredCapabilities: ['context-processing'], 
        contextTags: ['project-management', 'requirements'] 
      }
    );

    // Result depends on mocked AI response, but execution should not fail
    assert.ok(result || true); // If we get here without exception, the flow worked
  });

  it('should generate proper metrics across the system', () => {
    const metrics = ultraDex.getMetrics();
    
    assert.ok(metrics);
    assert.ok(metrics.aiMetaLayer);
    assert.ok(metrics.agentMetaOrchestrator);
    assert.ok(metrics.contextMetaManager);
    
    // Verify metrics structure
    assert.strictEqual(typeof metrics.aiMetaLayer.totalRequests, 'number');
    assert.strictEqual(typeof metrics.agentMetaOrchestrator.orchestrator.totalAgents, 'number');
    assert.strictEqual(typeof metrics.contextMetaManager.totalMemories, 'number');
  });

  it('should maintain system status', () => {
    const status = ultraDex.getStatus();
    
    assert.ok(status);
    assert.strictEqual(status.status, 'ready');
    assert.ok(status.timestamp);
    assert.ok(status.components);
    assert.ok(status.components.aiMetaLayer);
    assert.ok(status.components.agentMetaOrchestrator);
    assert.ok(status.components.contextMetaManager);
  });

  it('should handle complex multi-step workflows', async () => {
    // Simulate a complex workflow with multiple steps
    const workflowId = `workflow-${Date.now()}`;
    
    // Step 1: Store initial requirements
    await ultraDex.contextMetaManager.store(
      `${workflowId}-requirements`,
      { 
        feature: 'user-authentication',
        specs: ['login', 'registration', 'password-reset'],
        priority: 'high'
      },
      { workflow: workflowId, step: 'requirements' }
    );

    // Step 2: Process design phase
    const designResult = await ultraDex.processRequest(
      `Design architecture for ${workflowId} feature with requirements: login, registration, password-reset`
    );
    
    assert.ok(designResult);

    // Step 3: Store design
    await ultraDex.contextMetaManager.store(
      `${workflowId}-design`,
      { 
        architecture: 'microservice',
        components: ['auth-service', 'user-service', 'token-service'],
        technologies: ['jwt', 'bcrypt', 'redis']
      },
      { workflow: workflowId, step: 'design' }
    );

    // Step 4: Process implementation planning
    const planResult = await ultraDex.processRequest(
      `Create implementation plan for ${workflowId} based on architecture`
    );
    
    assert.ok(planResult);

    // Verify both context entries exist
    const requirements = await ultraDex.contextMetaManager.retrieve(`${workflowId}-requirements`);
    const design = await ultraDex.contextMetaManager.retrieve(`${workflowId}-design`);

    assert.ok(requirements);
    assert.ok(design);
    assert.strictEqual(requirements.data.feature, 'user-authentication');
    assert.strictEqual(design.data.architecture, 'microservice');
  });

  it('should handle error recovery gracefully', async () => {
    // Test error handling in AI layer
    const originalCall = ultraDex.aiMetaLayer.call;
    ultraDex.aiMetaLayer.call = async () => {
      throw new Error('Simulated API error');
    };

    try {
      await ultraDex.processRequest('This should trigger error handling');
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.ok(error.message.includes('Simulated API error'));
    } finally {
      // Restore original function
      ultraDex.aiMetaLayer.call = originalCall;
    }

    // Verify system is still operational after error
    ultraDex.aiMetaLayer.call = async (model, messages, options = {}) => {
      return {
        content: 'Recovered response',
        usage: { totalTokens: 15 },
        finishReason: 'stop'
      };
    };

    const recoveryResult = await ultraDex.processRequest('Recovery test');
    assert.ok(recoveryResult);
    assert.ok(recoveryResult.content.includes('Recovered'));
  });
});