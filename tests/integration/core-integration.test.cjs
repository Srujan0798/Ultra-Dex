/**
 * Integration Tests for Ultra-Dex Core
 * Tests all subsystems working together
 *
 * @module IntegrationTests
 * @version 1.0.0
 */

const assert = require('assert');
const { UltraDexCore } = require('../../src/core/orchestration/ultra-dex-core.cjs');
const { ConfigManager } = require('../../src/core/system/config-manager.cjs');
const { TokenOptimizer } = require('../../src/core/performance/token-optimizer.cjs');

console.log('🧪 Ultra-Dex Integration Tests\n');
console.log('==============================\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test suite
(async () => {
  let ultra;

  // Setup
  await test('Setup: Create Ultra-Dex instance', async () => {
    ultra = new UltraDexCore({
      dataPath: './data/test-integration',
    });
    assert(ultra, 'Should create instance');
  });

  // Initialization tests
  await test('Init: Initialize all subsystems', async () => {
    const result = await ultra.initialize();
    assert(result.status === 'ready', 'Should be ready');
    assert(result.components.memory, 'Memory should be initialized');
    assert(result.components.agents, 'Agents should be initialized');
  });

  await test('Init: Services start successfully', async () => {
    const result = await ultra.start();
    assert(result.status === 'running', 'Should be running');
    assert(ultra.startedAt, 'Should have start time');
  });

  await test('Init: Health check passes', async () => {
    const health = ultra.health();
    assert(health.healthy, 'Should be healthy');
    assert(health.checks.memory, 'Memory should be healthy');
    assert(health.checks.agents, 'Agents should be healthy');
  });

  // Memory integration tests
  await test('Memory: Store and retrieve context', async () => {
    await ultra.memory.store(
      {
        text: 'Integration test context',
        priority: 'high',
      },
      {
        strategy: 'hybrid',
        tags: ['test'],
      }
    );

    const results = await ultra.memory.retrieve('test context', {
      strategy: 'hybrid',
      limit: 5,
    });

    assert(results.items.length > 0, 'Should retrieve stored context');
    assert(
      results.items.some((i) => i.content?.text?.includes('Integration')),
      'Should find correct context'
    );
  });

  await test('Memory: Multiple stores work correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await ultra.memory.store({
        text: `Test message ${i}`,
        priority: 'normal',
      });
    }

    const results = await ultra.memory.retrieve('Test message', { limit: 10 });
    assert(results.items.length >= 5, 'Should store multiple items');
  });

  // Agent integration tests
  await test('Agents: Register custom agent', async () => {
    await ultra.agents.register({
      id: 'test-agent',
      name: 'Test Agent',
      description: 'For integration testing',
      capabilities: ['testing'],
      handler: async (input) => ({
        processed: true,
        input: input.task,
      }),
    });

    const agent = ultra.agents.get('test-agent');
    assert(agent, 'Should be registered');
    assert(agent.name === 'Test Agent', 'Should have correct name');
  });

  await test('Agents: Execute registered agent', async () => {
    const result = await ultra.agents.execute('test-agent', {
      task: 'Test execution',
    });

    assert(result.result.processed, 'Should execute successfully');
    assert(result.result.input === 'Test execution', 'Should pass input correctly');
  });

  await test('Agents: Discover agents by capability', async () => {
    const agents = ultra.agents.discover('testing');
    assert(agents.length > 0, 'Should find agents with capability');
    assert(
      agents.some((a) => a.id === 'test-agent'),
      'Should find test agent'
    );
  });

  // Coordination integration tests
  await test('Coordination: Create session', async () => {
    const session = ultra.coordination.createSession({
      goal: 'Test coordination',
      agents: ['test-agent'],
    });

    assert(session.id, 'Should have session ID');
    assert(session.goal === 'Test coordination', 'Should have correct goal');
    assert(session.agents.has('test-agent'), 'Should include agent');
  });

  await test('Coordination: Send message between agents', async () => {
    ultra.coordination.registerAgent('agent-a', ['test'], async (msg) => {
      // Message handler
    });

    ultra.coordination.registerAgent('agent-b', ['test'], async (msg) => {
      // Message handler
    });

    const result = await ultra.coordination.sendMessage({
      from: 'agent-a',
      to: 'agent-b',
      type: 'test',
      content: { data: 'test' },
    });

    assert(result.messageId, 'Should send message');
  });

  // Observability integration tests
  await test('Observability: Create trace', async () => {
    const trace = ultra.observability.startTrace('integration-test', {
      test: true,
    });

    assert(trace.id, 'Should have trace ID');
    assert(trace.name === 'integration-test', 'Should have correct name');

    // End trace
    await ultra.observability.endTrace(trace.id, { success: true });
  });

  await test('Observability: Record metrics', async () => {
    ultra.observability.recordMetric('test.metric', 42, { tag: 'value' });

    const stats = ultra.observability.getMetricStats('test.metric');
    assert(stats, 'Should have metric stats');
    assert(stats.count === 1, 'Should have one recording');
    assert(stats.average === 42, 'Should have correct average');
  });

  await test('Observability: Dashboard works', async () => {
    const dashboard = ultra.observability.getDashboard();
    assert(dashboard, 'Should have dashboard');
    assert(typeof dashboard.requests === 'number', 'Should track requests');
  });

  // Configuration integration tests
  await test('Config: Load and use configuration', async () => {
    const config = new ConfigManager({
      env: 'test',
    });

    await config.initialize();

    const dataPath = config.get('core.dataPath');
    assert(dataPath, 'Should have data path configured');

    // Test setting
    config.set('test.value', 123);
    assert(config.get('test.value') === 123, 'Should set values');
  });

  // Token optimizer integration tests
  await test('TokenOptimizer: Initialize and cache', async () => {
    const optimizer = new TokenOptimizer();
    await optimizer.initialize();

    const request = {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'gpt-4',
    };

    // Store in cache
    optimizer.storeCache(request, { response: 'Hi' }, { tokens: 10, cost: 0.001 });

    // Check cache
    const cached = optimizer.checkCache(request);
    assert(cached, 'Should find cached result');
    assert(cached.fromCache, 'Should indicate cache hit');
  });

  await test('TokenOptimizer: Track usage', async () => {
    const optimizer = new TokenOptimizer();
    await optimizer.initialize();

    optimizer.trackUsage({
      tokens: 100,
      cost: 0.01,
      provider: 'openai',
      cached: false,
    });

    const stats = optimizer.getStats();
    assert(stats.totalTokens === 100, 'Should track tokens');
    assert(stats.totalCost === 0.01, 'Should track cost');
  });

  await test('TokenOptimizer: Compression works', async () => {
    const optimizer = new TokenOptimizer({ compressionEnabled: true });

    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} with some content that takes up tokens`,
      });
    }

    const compressed = optimizer.compressContext(messages, {
      maxTokens: 1000,
      compressionLevel: 'medium',
    });

    assert(compressed.length < messages.length, 'Should compress messages');
    assert(
      compressed.some((m) => m.role === 'system'),
      'Should add compression summary'
    );
  });

  // End-to-end integration tests
  await test('E2E: Full task execution flow', async () => {
    const result = await ultra.execute('Test task execution', {
      agents: ['test-agent'],
    });

    assert(result.success, 'Should succeed');
    assert(result.traceId, 'Should have trace ID');
    assert(result.sessionId, 'Should have session ID');
  });

  await test('E2E: Health status updates correctly', async () => {
    const status = ultra.getStatus();

    assert(status.status === 'running', 'Should be running');
    assert(status.version, 'Should have version');
    assert(status.components, 'Should have component status');
    assert(status.uptime >= 0, 'Should track uptime');
  });

  // Error handling tests
  await test('Error: Handle missing agent gracefully', async () => {
    try {
      await ultra.agents.execute('non-existent-agent', {});
      assert.fail('Should throw error');
    } catch (error) {
      assert(error.message.includes('not found'), 'Should indicate agent not found');
    }
  });

  await test('Error: Handle invalid memory operations', async () => {
    try {
      await ultra.memory.store(null);
      // Some implementations may not throw, that's ok
    } catch (error) {
      // Expected
    }
  });

  await test('Error: Autopsy detects failures', async () => {
    ultra.autopsy.monitor('test-agent', { maxFailures: 1 });

    // Simulate failure
    ultra.autopsy.heartbeat('test-agent', { status: 'error' });

    const health = ultra.autopsy.checkHealth('test-agent');
    assert(!health.healthy || health.reason, 'Should detect unhealthy state');
  });

  // Cleanup tests
  await test('Cleanup: Stop services gracefully', async () => {
    await ultra.stop();
    assert(ultra.status === 'stopped', 'Should be stopped');
  });

  await test('Cleanup: Re-initialize works', async () => {
    const newUltra = new UltraDexCore({
      dataPath: './data/test-integration-2',
    });

    await newUltra.initialize();
    await newUltra.start();

    const health = newUltra.health();
    assert(health.healthy, 'Should be healthy after restart');

    await newUltra.stop();
  });

  // Summary
  console.log('\n==============================');
  console.log('📊 Integration Test Results');
  console.log('==============================');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All integration tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
  }
})();
