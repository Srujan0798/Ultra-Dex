// Copyright (c) 2026 Ultra-Dex
// tests/performance/benchmark.test.js

import { describe, it, before, after, bench } from 'node:test';
import assert from 'assert';
import { performance } from 'perf_hooks';
import { ultraDex } from '../../packages/core/index.js';

describe('Performance Benchmarks', () => {
  before(async () => {
    // Initialize the system
    await ultraDex.initialize();
    
    // Mock AI providers to avoid actual API calls
    ultraDex.aiMetaLayer.call = async (model, messages, options = {}) => {
      // Simulate realistic AI response time
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms simulated AI call
      return {
        content: `Mocked response for: ${messages[messages.length - 1]?.content || 'request'}`,
        usage: { totalTokens: 25 },
        finishReason: 'stop'
      };
    };
  });

  after(async () => {
    if (ultraDex.isInitialized) {
      await ultraDex.shutdown();
    }
  });

  it('should meet performance benchmarks', async () => {
    // This test will run benchmarks and verify they meet requirements
    const results = await runPerformanceBenchmarks();
    
    // Verify all benchmarks meet requirements
    assert.ok(results.agentRegistration.time < 5, `Agent registration took ${results.agentRegistration.time}ms, expected < 5ms`);
    assert.ok(results.aiCall.time < 200, `AI call took ${results.aiCall.time}ms, expected < 200ms`);
    assert.ok(results.contextRetrieval.time < 10, `Context retrieval took ${results.contextRetrieval.time}ms, expected < 10ms`);
    assert.ok(results.memoryStorage.time < 5, `Memory storage took ${results.memoryStorage.time}ms, expected < 5ms`);
    
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS:');
    console.log(`   Agent Registration: ${results.agentRegistration.time.toFixed(2)}ms (${results.agentRegistration.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`   AI Call: ${results.aiCall.time.toFixed(2)}ms (${results.aiCall.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`   Context Retrieval: ${results.contextRetrieval.time.toFixed(2)}ms (${results.contextRetrieval.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`   Memory Storage: ${results.memoryStorage.time.toFixed(2)}ms (${results.memoryStorage.opsPerSec.toFixed(2)} ops/sec)`);
    console.log(`   Concurrent Agents: ${results.concurrentAgents.time.toFixed(2)}ms for ${results.concurrentAgents.count} agents`);
  });

  bench('Agent Registration Performance', async () => {
    // Register an agent
    ultraDex.agentMetaOrchestrator.registerAgent(`perf-test-${Date.now()}`, {
      name: 'Performance Test Agent',
      description: 'Agent for performance testing',
      capabilities: ['performance', 'testing'],
      priority: 5,
      maxConcurrency: 1
    });
  });

  bench('AI Call Performance', async () => {
    // Simulate AI call with mocked response
    await ultraDex.aiMetaLayer.call('gpt-4o-2024-11-20', [
      { role: 'user', content: 'Performance test message' }
    ]);
  });

  bench('Context Storage Performance', async () => {
    // Store data in context manager
    await ultraDex.contextMetaManager.store(
      `perf-test-key-${Date.now()}`,
      { test: 'performance data', timestamp: Date.now() },
      { category: 'performance', type: 'benchmark' }
    );
  });

  bench('Context Retrieval Performance', async () => {
    // First store some data
    const key = `perf-retrieve-test-${Date.now()}`;
    await ultraDex.contextMetaManager.store(key, { data: 'test' });
    
    // Then retrieve it
    await ultraDex.contextMetaManager.retrieve(key);
  });

  bench('Concurrent Agent Execution', async () => {
    // Register multiple agents
    const agentIds = [];
    for (let i = 0; i < 5; i++) {
      const agentId = `concurrent-test-${Date.now()}-${i}`;
      ultraDex.agentMetaOrchestrator.registerAgent(agentId, {
        name: `Concurrent Agent ${i}`,
        description: 'Agent for concurrent testing',
        capabilities: ['concurrent'],
        priority: 5,
        maxConcurrency: 1
      });
      agentIds.push(agentId);
    }

    // Execute tasks concurrently
    const promises = agentIds.map(id => 
      ultraDex.agentMetaOrchestrator.executeSingleAgent(
        ultraDex.agentMetaOrchestrator.agents.get(id), 
        'Concurrent performance test task',
        {},
        `session-${Date.now()}-${id}`
      )
    );

    await Promise.all(promises);
  });
});

async function runPerformanceBenchmarks() {
  const results = {};

  // Benchmark agent registration
  const agentRegStart = performance.now();
  const regOps = [];
  for (let i = 0; i < 100; i++) {
    const agentId = `benchmark-agent-${Date.now()}-${i}`;
    ultraDex.agentMetaOrchestrator.registerAgent(agentId, {
      name: `Benchmark Agent ${i}`,
      description: 'Agent for benchmarking',
      capabilities: ['benchmark'],
      priority: 5,
      maxConcurrency: 1
    });
    regOps.push(agentId);
  }
  const agentRegEnd = performance.now();
  const agentRegTime = (agentRegEnd - agentRegStart) / 100; // Average time per operation
  const agentRegOpsPerSec = 1000 / agentRegTime;
  results.agentRegistration = { time: agentRegTime, opsPerSec: agentRegOpsPerSec };

  // Benchmark AI calls
  const aiCallStart = performance.now();
  const aiOps = [];
  for (let i = 0; i < 50; i++) {
    const op = ultraDex.aiMetaLayer.call('gpt-4o-2024-11-20', [
      { role: 'user', content: `AI call benchmark ${i}` }
    ]);
    aiOps.push(op);
  }
  await Promise.all(aiOps);
  const aiCallEnd = performance.now();
  const aiCallTime = (aiCallEnd - aiCallStart) / 50; // Average time per operation
  const aiCallOpsPerSec = 1000 / aiCallTime;
  results.aiCall = { time: aiCallTime, opsPerSec: aiCallOpsPerSec };

  // Benchmark context storage
  const ctxStoreStart = performance.now();
  const ctxStoreOps = [];
  for (let i = 0; i < 100; i++) {
    const op = ultraDex.contextMetaManager.store(
      `ctx-benchmark-${Date.now()}-${i}`,
      { benchmark: i, data: `test data ${i}` },
      { category: 'benchmark' }
    );
    ctxStoreOps.push(op);
  }
  await Promise.all(ctxStoreOps);
  const ctxStoreEnd = performance.now();
  const ctxStoreTime = (ctxStoreEnd - ctxStoreStart) / 100; // Average time per operation
  const ctxStoreOpsPerSec = 1000 / ctxStoreTime;
  results.memoryStorage = { time: ctxStoreTime, opsPerSec: ctxStoreOpsPerSec };

  // Benchmark context retrieval
  // First populate some data
  const retrievalKeys = [];
  for (let i = 0; i < 100; i++) {
    const key = `retrieval-benchmark-${Date.now()}-${i}`;
    retrievalKeys.push(key);
    await ultraDex.contextMetaManager.store(key, { data: `retrieval test ${i}` });
  }

  const ctxRetrieveStart = performance.now();
  const ctxRetrieveOps = [];
  for (const key of retrievalKeys) {
    const op = ultraDex.contextMetaManager.retrieve(key);
    ctxRetrieveOps.push(op);
  }
  await Promise.all(ctxRetrieveOps);
  const ctxRetrieveEnd = performance.now();
  const ctxRetrieveTime = (ctxRetrieveEnd - ctxRetrieveStart) / 100; // Average time per operation
  const ctxRetrieveOpsPerSec = 1000 / ctxRetrieveTime;
  results.contextRetrieval = { time: ctxRetrieveTime, opsPerSec: ctxRetrieveOpsPerSec };

  // Benchmark concurrent agents
  const concurrentStart = performance.now();
  const concurrentAgentIds = [];
  for (let i = 0; i < 10; i++) {
    const agentId = `concurrent-benchmark-${Date.now()}-${i}`;
    ultraDex.agentMetaOrchestrator.registerAgent(agentId, {
      name: `Concurrent Benchmark Agent ${i}`,
      description: 'Agent for concurrent benchmarking',
      capabilities: ['benchmark', 'concurrent'],
      priority: 7,
      maxConcurrency: 2
    });
    concurrentAgentIds.push(agentId);
  }

  const concurrentOps = concurrentAgentIds.map(id => 
    ultraDex.agentMetaOrchestrator.executeSingleAgent(
      ultraDex.agentMetaOrchestrator.agents.get(id), 
      'Concurrent benchmark task',
      {},
      `concurrent-session-${Date.now()}-${id}`
    )
  );

  await Promise.all(concurrentOps);
  const concurrentEnd = performance.now();
  results.concurrentAgents = { 
    time: concurrentEnd - concurrentStart, 
    count: concurrentAgentIds.length,
    opsPerSec: concurrentAgentIds.length / ((concurrentEnd - concurrentStart) / 1000)
  };

  return results;
}