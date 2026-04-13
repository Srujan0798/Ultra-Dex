# 🧪 V2.1 Adapters & Cache Testing Strategy

**Version:** 2.1.0-alpha  
**Date:** 2026-04-14  
**Status:** Active  
**Coverage Target:** 90%+

---

## 📋 Executive Summary

This document defines the comprehensive testing strategy for Ultra-Dex V2.1's new components:

| Component | Test Focus | Priority |
|-----------|------------|----------|
| **RedisCacheAdapter** | Connection pooling, TTL, pub/sub, failover | P0 |
| **LLM Adapters** | OpenAI, Anthropic, Google Gemini mocking | P0 |
| **Adapter Factory** | Provider selection, circuit breaker, fallback | P0 |
| **Integration Layer** | Cache + adapter interaction | P0 |

---

## 📊 Test Pyramid for V2.1

```
                    /\
                   /  \     E2E Tests (5%)
                  /____\    - Critical workflows
                 /      \   - Multi-provider failover
                /________\  - Cache recovery scenarios
               /          \
              /____________\ Integration Tests (25%)
              |            | - Adapter factory + cache
              |            | - Circuit breaker patterns
              |            | - Fallback chain orchestration
              |____________|
             /              \
            /________________\ Unit Tests (70%)
            |                | - Adapter unit tests
            |                | - Cache operations
            |                | - Factory logic
            |________________|
```

---

## 1. Unit Testing Strategy

### 1.1 RedisCacheAdapter Tests

**File:** `tests/unit/cache/redisCacheAdapter.test.ts`

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { RedisCacheAdapter } from '../../../src/cache/redisCacheAdapter.js';
import { RedisConnectionPool } from '../../../src/cache/connectionPool.js';

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;
  let pool: RedisConnectionPool;

  beforeEach(async () => {
    pool = new RedisConnectionPool({
      minConnections: 2,
      maxConnections: 5,
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: 6379,
    });
    adapter = new RedisCacheAdapter({
      pool,
      namespace: 'test:v2.1',
    });
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.clear();
    await adapter.close();
  });

  describe('Connection Pooling', () => {
    it('should maintain minConnections at idle', async () => {
      await new Promise(r => setTimeout(r, 100));
      const stats = pool.getStats();
      assert.strictEqual(stats.activeConnections, 2);
    });

    it('should scale up to maxConnections under load', async () => {
      const promises = Array(20).fill(null).map((_, i) => 
        adapter.set(`key-${i}`, `value-${i}`)
      );
      await Promise.all(promises);
      
      const stats = pool.getStats();
      assert.ok(stats.activeConnections <= 5);
      assert.ok(stats.activeConnections > 2);
    });

    it('should handle connection failures gracefully', async () => {
      const badPool = new RedisConnectionPool({
        host: 'invalid-host',
        port: 6379,
        retryStrategy: () => null, // Disable retry
      });
      
      await assert.rejects(
        () => badPool.execute(() => Promise.resolve()),
        /Connection failed/
      );
    });

    it('should reuse connections efficiently', async () => {
      const initialStats = pool.getStats();
      
      for (let i = 0; i < 100; i++) {
        await adapter.get(`key-${i}`);
      }
      
      const finalStats = pool.getStats();
      // Should reuse, not create 100 connections
      assert.ok(finalStats.totalCreated < 10);
    });
  });

  describe('TTL Management', () => {
    it('should respect TTL for set operations', async () => {
      await adapter.set('temp-key', 'temp-value', { ttl: 1 }); // 1 second
      
      let value = await adapter.get('temp-key');
      assert.strictEqual(value, 'temp-value');
      
      await new Promise(r => setTimeout(r, 1100));
      
      value = await adapter.get('temp-key');
      assert.strictEqual(value, undefined);
    });

    it('should support NX (only if not exists)', async () => {
      await adapter.set('nx-key', 'first', { nx: true });
      await adapter.set('nx-key', 'second', { nx: true });
      
      const value = await adapter.get('nx-key');
      assert.strictEqual(value, 'first');
    });

    it('should support XX (only if exists)', async () => {
      await adapter.set('xx-key', 'value', { xx: true });
      
      let value = await adapter.get('xx-key');
      assert.strictEqual(value, undefined);
      
      await adapter.set('xx-key', 'initial');
      await adapter.set('xx-key', 'updated', { xx: true });
      
      value = await adapter.get('xx-key');
      assert.strictEqual(value, 'updated');
    });

    it('should handle workflow state with TTL', async () => {
      const state = { status: 'running', progress: 50 };
      await adapter.setWorkflowState('wf-123', state, { ttl: 60 });
      
      const ttl = await adapter.getTTL('wf-123');
      assert.ok(ttl <= 60 && ttl > 55);
    });
  });

  describe('Pub/Sub Operations', () => {
    it('should publish and receive messages', async () => {
      const messages: string[] = [];
      
      await adapter.subscribe('test-channel', (msg) => {
        messages.push(msg);
      });
      
      await adapter.publish('test-channel', 'hello');
      await new Promise(r => setTimeout(r, 100));
      
      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0], 'hello');
    });

    it('should support pattern-based subscriptions', async () => {
      const messages: string[] = [];
      
      await adapter.psubscribe('workflow:*:update', (channel, msg) => {
        messages.push(`${channel}:${msg}`);
      });
      
      await adapter.publish('workflow:123:update', 'data1');
      await adapter.publish('workflow:456:update', 'data2');
      await adapter.publish('other:channel', 'ignored');
      
      await new Promise(r => setTimeout(r, 100));
      
      assert.strictEqual(messages.length, 2);
    });

    it('should handle unsubscribe gracefully', async () => {
      let received = 0;
      
      const handler = () => received++;
      await adapter.subscribe('unsub-channel', handler);
      
      await adapter.publish('unsub-channel', 'msg1');
      await new Promise(r => setTimeout(r, 50));
      
      await adapter.unsubscribe('unsub-channel', handler);
      await adapter.publish('unsub-channel', 'msg2');
      await new Promise(r => setTimeout(r, 50));
      
      assert.strictEqual(received, 1);
    });
  });

  describe('Failover & Resilience', () => {
    it('should handle Redis disconnect gracefully', async () => {
      await adapter.set('key1', 'value1');
      
      // Simulate disconnect
      await pool.simulateDisconnect();
      
      // Should queue operations and retry
      await assert.doesNotReject(async () => {
        await adapter.set('key2', 'value2');
      });
    });

    it('should use replica for reads when available', async () => {
      const adapterWithReplica = new RedisCacheAdapter({
        pool,
        readReplicas: [{ host: 'replica1', port: 6379 }],
      });
      
      await adapterWithReplica.set('key', 'value');
      const value = await adapterWithReplica.get('key');
      
      assert.strictEqual(value, 'value');
      // Verify read came from replica (through metrics)
      const metrics = adapterWithReplica.getMetrics();
      assert.ok(metrics.replicaReads >= 1);
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate by tag', async () => {
      await adapter.set('wf:1', { data: 'a' }, { tags: ['workflow', 'v1'] });
      await adapter.set('wf:2', { data: 'b' }, { tags: ['workflow', 'v2'] });
      await adapter.set('other', { data: 'c' }, { tags: ['other'] });
      
      await adapter.invalidateByTag('workflow');
      
      assert.strictEqual(await adapter.get('wf:1'), undefined);
      assert.strictEqual(await adapter.get('wf:2'), undefined);
      assert.deepStrictEqual(await adapter.get('other'), { data: 'c' });
    });

    it('should support pattern-based invalidation', async () => {
      await adapter.set('cache:v1:key1', 'value1');
      await adapter.set('cache:v1:key2', 'value2');
      await adapter.set('cache:v2:key1', 'value3');
      
      await adapter.invalidatePattern('cache:v1:*');
      
      assert.strictEqual(await adapter.get('cache:v1:key1'), undefined);
      assert.strictEqual(await adapter.get('cache:v1:key2'), undefined);
      assert.strictEqual(await adapter.get('cache:v2:key1'), 'value3');
    });
  });
});
```

### 1.2 LLM Adapter Unit Tests

**Files:**
- `tests/unit/adapters/openaiAdapter.test.ts`
- `tests/unit/adapters/anthropicAdapter.test.ts`
- `tests/unit/adapters/googleAdapter.test.ts`

```typescript
// tests/unit/adapters/openaiAdapter.test.ts
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { OpenAIAdapter } from '../../../src/adapters/openaiAdapter.js';
import { createMockServer } from '../helpers/mockServer.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(async () => {
    mockServer = createMockServer('openai');
    await mockServer.start();
    
    adapter = new OpenAIAdapter({
      apiKey: 'test-key',
      baseURL: mockServer.url,
      model: 'gpt-4-turbo-preview',
      maxRetries: 2,
      timeoutMs: 5000,
    });
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  describe('Basic Operations', () => {
    it('should generate successful response', async () => {
      mockServer.setResponse({
        id: 'resp-1',
        choices: [{
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await adapter.run({
        nodeId: 'node-1',
        taskType: 'generate',
        input: { prompt: 'Say hello' },
      });

      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(result.output, 'Hello!');
      assert.ok(result.cost.tokens > 0);
    });

    it('should calculate costs correctly', async () => {
      mockServer.setResponse({
        choices: [{
          message: { role: 'assistant', content: 'Test' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 },
      });

      const result = await adapter.run({
        nodeId: 'node-2',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      // gpt-4-turbo: $10/1M input, $30/1M output
      // Expected: (1000 * 10 + 500 * 30) / 1,000,000 = $0.025
      assert.ok(result.cost.estimatedUSD > 0.02 && result.cost.estimatedUSD < 0.03);
    });

    it('should handle timeout correctly', async () => {
      mockServer.setDelay(6000); // Longer than timeoutMs

      const result = await adapter.run({
        nodeId: 'node-3',
        taskType: 'generate',
        input: { prompt: 'Slow response' },
        timeout: 100, // Short timeout
      });

      assert.strictEqual(result.status, 'FAILED');
      assert.ok(result.error?.includes('Timeout'));
    });
  });

  describe('Error Handling', () => {
    it('should handle 429 rate limit with retry', async () => {
      mockServer.setErrorSequence([
        { status: 429, body: 'Rate limited' },
        { status: 429, body: 'Rate limited' },
        { 
          status: 200, 
          body: {
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }
        },
      ]);

      const result = await adapter.run({
        nodeId: 'node-4',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(mockServer.requestCount, 3);
    });

    it('should handle 401 authentication error', async () => {
      mockServer.setErrorSequence([
        { status: 401, body: 'Invalid API key' },
      ]);

      const result = await adapter.run({
        nodeId: 'node-5',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      assert.strictEqual(result.status, 'FAILED');
      assert.ok(result.error?.includes('401'));
    });

    it('should handle 500 server error with retry', async () => {
      mockServer.setErrorSequence([
        { status: 500, body: 'Server error' },
        { 
          status: 200, 
          body: {
            choices: [{ message: { content: 'Recovered' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }
        },
      ]);

      const result = await adapter.run({
        nodeId: 'node-6',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      assert.strictEqual(result.status, 'SUCCESS');
    });

    it('should handle network errors gracefully', async () => {
      await mockServer.stop(); // Simulate network failure

      const result = await adapter.run({
        nodeId: 'node-7',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      assert.strictEqual(result.status, 'FAILED');
      assert.ok(result.error);
    });

    it('should handle malformed JSON response', async () => {
      mockServer.setRawResponse('invalid json {', 200);

      const result = await adapter.run({
        nodeId: 'node-8',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      assert.strictEqual(result.status, 'FAILED');
      assert.ok(result.error?.includes('JSON'));
    });
  });

  describe('Streaming', () => {
    it('should handle streaming response', async () => {
      const chunks = ['Hello', ' ', 'World', '!'];
      mockServer.setStreamingResponse(chunks);

      const outputs: string[] = [];
      const result = await adapter.run({
        nodeId: 'node-9',
        taskType: 'generate',
        input: { prompt: 'Stream test' },
        stream: true,
        onStream: (chunk) => outputs.push(chunk),
      });

      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(outputs.join(''), 'Hello World!');
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel in-flight requests', async () => {
      mockServer.setDelay(1000);

      const runPromise = adapter.run({
        nodeId: 'node-10',
        taskType: 'generate',
        input: { prompt: 'Slow' },
      });

      // Cancel immediately
      await adapter.cancel('node-10');

      const result = await runPromise;
      assert.strictEqual(result.status, 'FAILED');
    });

    it('should track running status correctly', async () => {
      mockServer.setDelay(500);

      const promise = adapter.run({
        nodeId: 'node-11',
        taskType: 'generate',
        input: { prompt: 'Test' },
      });

      const status1 = await adapter.status('node-11');
      assert.strictEqual(status1.running, true);

      await promise;

      const status2 = await adapter.status('node-11');
      assert.strictEqual(status2.running, false);
    });
  });
});
```

### 1.3 Adapter Factory Tests

**File:** `tests/unit/adapters/adapterFactory.test.ts`

```typescript
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { LLMAdapterFactory } from '../../../src/adapters/adapterFactory.js';
import { CircuitBreaker } from '../../../src/adapters/circuitBreaker.js';

describe('LLMAdapterFactory', () => {
  let factory: LLMAdapterFactory;

  beforeEach(() => {
    factory = new LLMAdapterFactory({
      defaultProvider: 'openai',
      fallbackChain: ['anthropic', 'google', 'ollama'],
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        resetTimeout: 30000,
      },
      providerConfigs: {
        openai: { apiKey: 'test-openai' },
        anthropic: { apiKey: 'test-anthropic' },
        google: { apiKey: 'test-google' },
        ollama: { baseURL: 'http://localhost:11434' },
      },
    });
  });

  describe('Provider Creation', () => {
    it('should create OpenAI adapter', () => {
      const adapter = factory.createProvider('openai');
      assert.strictEqual(adapter.name(), 'openai:gpt-4-turbo-preview');
    });

    it('should create Anthropic adapter', () => {
      const adapter = factory.createProvider('anthropic');
      assert.ok(adapter.name().startsWith('anthropic:'));
    });

    it('should throw for unknown provider', () => {
      assert.throws(
        () => factory.createProvider('unknown'),
        /Unknown provider/
      );
    });

    it('should register custom provider', () => {
      const CustomAdapter = class {
        name() { return 'custom:test'; }
        async run() { return { status: 'SUCCESS' }; }
      };

      factory.registerProvider('custom', CustomAdapter);
      const adapter = factory.createProvider('custom');
      
      assert.strictEqual(adapter.name(), 'custom:test');
    });
  });

  describe('Circuit Breaker', () => {
    it('should wrap adapter with circuit breaker', () => {
      const adapter = factory.createProvider('openai');
      
      // Circuit breaker should be transparent for normal operations
      assert.ok(adapter);
    });

    it('should open circuit after threshold failures', async () => {
      const cb = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
      });

      let callCount = 0;
      const failingFn = async () => {
        callCount++;
        throw new Error('Always fails');
      };

      // First 3 calls should execute
      await assert.rejects(() => cb.execute(failingFn));
      await assert.rejects(() => cb.execute(failingFn));
      await assert.rejects(() => cb.execute(failingFn));
      
      // 4th call should fail fast (circuit open)
      await assert.rejects(
        () => cb.execute(failingFn),
        /Circuit breaker is OPEN/
      );
      
      assert.strictEqual(callCount, 3);
    });

    it('should half-open circuit after timeout', async () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100, // Short timeout for testing
      });

      const failingFn = async () => { throw new Error('Fail'); };
      
      await cb.execute(failingFn).catch(() => {});
      await cb.execute(failingFn).catch(() => {});
      
      // Circuit should be open now
      await assert.rejects(
        () => cb.execute(failingFn),
        /Circuit breaker is OPEN/
      );
      
      // Wait for reset timeout
      await new Promise(r => setTimeout(r, 150));
      
      // Next call should half-open (allow through)
      let halfOpenExecuted = false;
      const halfOpenFn = async () => { 
        halfOpenExecuted = true; 
        return 'success'; 
      };
      
      const result = await cb.execute(halfOpenFn);
      assert.strictEqual(result, 'success');
      assert.strictEqual(halfOpenExecuted, true);
    });
  });

  describe('Fallback Chain', () => {
    it('should create fallback chain', () => {
      const chain = factory.createFallbackChain('openai');
      
      assert.ok(chain);
      assert.strictEqual(chain.providers.length, 4);
    });

    it('should try primary first on success', async () => {
      const chain = factory.createFallbackChain('mock');
      
      let primaryCalled = false;
      let fallbackCalled = false;
      
      const mockPrimary = {
        name: () => 'primary',
        run: async () => { primaryCalled = true; return { status: 'SUCCESS' }; },
      };
      
      const mockFallback = {
        name: () => 'fallback',
        run: async () => { fallbackCalled = true; return { status: 'SUCCESS' }; },
      };
      
      const testChain = factory.createFallbackChainFromProviders([mockPrimary, mockFallback]);
      await testChain.execute({ nodeId: 'test', taskType: 'test', input: {} });
      
      assert.strictEqual(primaryCalled, true);
      assert.strictEqual(fallbackCalled, false);
    });

    it('should fall back on primary failure', async () => {
      let fallbackCalled = false;
      
      const mockPrimary = {
        name: () => 'primary',
        run: async () => { throw new Error('Primary failed'); },
      };
      
      const mockFallback = {
        name: () => 'fallback',
        run: async () => { 
          fallbackCalled = true; 
          return { status: 'SUCCESS', output: 'fallback-result' }; 
        },
      };
      
      const chain = factory.createFallbackChainFromProviders([mockPrimary, mockFallback]);
      const result = await chain.execute({ nodeId: 'test', taskType: 'test', input: {} });
      
      assert.strictEqual(fallbackCalled, true);
      assert.strictEqual(result.status, 'SUCCESS');
      assert.strictEqual(result.output, 'fallback-result');
    });

    it('should report degraded mode when using fallback', async () => {
      const mockPrimary = {
        name: () => 'primary',
        run: async () => { throw new Error('Fail'); },
      };
      
      const mockFallback = {
        name: () => 'fallback',
        run: async () => ({ status: 'SUCCESS', output: 'result' }),
      };
      
      const chain = factory.createFallbackChainFromProviders([mockPrimary, mockFallback]);
      const result = await chain.execute({ nodeId: 'test', taskType: 'test', input: {} });
      
      assert.strictEqual(result.degraded, true);
      assert.ok(result.logs?.some(l => l.includes('fallback')));
    });

    it('should fail when all providers fail', async () => {
      const mockAdapter = {
        name: () => 'always-fails',
        run: async () => { throw new Error('Failed'); },
      };
      
      const chain = factory.createFallbackChainFromProviders([mockAdapter, mockAdapter]);
      
      await assert.rejects(
        () => chain.execute({ nodeId: 'test', taskType: 'test', input: {} }),
        /All providers failed/
      );
    });
  });

  describe('Provider Health Checks', () => {
    it('should track provider health', async () => {
      factory.updateHealth('openai', { status: 'healthy', latency: 100 });
      
      const health = factory.getHealth('openai');
      assert.strictEqual(health.status, 'healthy');
      assert.strictEqual(health.latency, 100);
    });

    it('should prefer healthy providers', () => {
      factory.updateHealth('openai', { status: 'unhealthy', latency: 5000 });
      factory.updateHealth('anthropic', { status: 'healthy', latency: 100 });
      
      const provider = factory.selectBestProvider(['openai', 'anthropic']);
      assert.ok(provider.name().includes('anthropic'));
    });
  });
});
```

---

## 2. Integration Testing Strategy

### 2.1 Cache + Adapter Integration

**File:** `tests/integration/cache-adapter-integration.test.ts`

```typescript
import { describe, it, beforeAll, afterAll } from 'node:test';
import assert from 'node:assert';
import { RedisCacheAdapter } from '../../src/cache/redisCacheAdapter.js';
import { LLMAdapterFactory } from '../../src/adapters/adapterFactory.js';
import { TestContainers } from '../helpers/testContainers.js';

describe('Cache + Adapter Integration', () => {
  let redis: RedisCacheAdapter;
  let factory: LLMAdapterFactory;
  let mockServer: any;

  beforeAll(async () => {
    // Start Redis container
    const container = await TestContainers.startRedis();
    redis = new RedisCacheAdapter({
      host: container.getHost(),
      port: container.getPort(),
    });
    await redis.connect();

    // Start mock LLM server
    mockServer = await TestContainers.startMockLLMServer();
    
    factory = new LLMAdapterFactory({
      defaultProvider: 'openai',
      providerConfigs: {
        openai: { 
          apiKey: 'test', 
          baseURL: mockServer.url 
        },
      },
    });
  });

  afterAll(async () => {
    await redis.close();
    await TestContainers.stopAll();
  });

  describe('Response Caching', () => {
    it('should cache LLM responses', async () => {
      const adapter = factory.createProvider('openai');
      const cacheKey = 'llm:response:test-prompt';

      mockServer.setResponse({
        choices: [{ message: { content: 'Cached response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      // First call - hits API
      const result1 = await adapter.run({
        nodeId: 'node-1',
        taskType: 'generate',
        input: { prompt: 'test-prompt' },
      });
      await redis.set(cacheKey, result1, { ttl: 3600 });

      // Second call - should use cache
      const cached = await redis.get(cacheKey);
      
      assert.strictEqual(cached.output, 'Cached response');
    });

    it('should invalidate cache on model change', async () => {
      const cacheKey = 'llm:response:prompt:v1';
      await redis.set(cacheKey, { output: 'old-model' }, { tags: ['model:v1'] });

      // Simulate model upgrade
      await redis.invalidateByTag('model:v1');

      const cached = await redis.get(cacheKey);
      assert.strictEqual(cached, undefined);
    });

    it('should cache workflow states with adapter results', async () => {
      const workflowId = 'wf-integration-1';
      const nodeId = 'node-1';

      // Execute through adapter
      const adapter = factory.createProvider('openai');
      mockServer.setResponse({
        choices: [{ message: { content: 'Workflow result' } }],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      });

      const result = await adapter.run({
        nodeId,
        taskType: 'process',
        input: { data: 'workflow-input' },
      });

      // Store workflow state with result
      const state = {
        nodeId,
        status: result.status,
        output: result.output,
        cost: result.cost,
        timestamp: Date.now(),
      };

      await redis.setWorkflowState(workflowId, state, { ttl: 300 });

      // Retrieve and verify
      const retrieved = await redis.getWorkflowState(workflowId);
      assert.deepStrictEqual(retrieved, state);
    });
  });

  describe('Rate Limit Coordination', () => {
    it('should coordinate rate limits across instances via cache', async () => {
      const rateLimitKey = 'rate:limit:openai:requests';
      
      // Simulate multiple instances checking rate limit
      const checks = Array(10).fill(null).map(async (_, i) => {
        const current = await redis.incr(rateLimitKey);
        if (current > 5) {
          return 'rate_limited';
        }
        return 'allowed';
      });

      const results = await Promise.all(checks);
      
      const allowed = results.filter(r => r === 'allowed').length;
      const limited = results.filter(r => r === 'rate_limited').length;

      assert.strictEqual(allowed, 5);
      assert.strictEqual(limited, 5);
    });
  });

  describe('Circuit Breaker State Sharing', () => {
    it('should share circuit breaker state via Redis pub/sub', async () => {
      const circuitStateKey = 'circuit:openai:state';
      
      // Simulate circuit open on instance A
      await redis.set(circuitStateKey, { state: 'OPEN', timestamp: Date.now() });
      await redis.publish('circuit:events', { provider: 'openai', state: 'OPEN' });

      // Instance B should receive the event
      let receivedEvent: any;
      await redis.subscribe('circuit:events', (msg) => {
        receivedEvent = msg;
      });

      await new Promise(r => setTimeout(r, 100));

      assert.strictEqual(receivedEvent?.provider, 'openai');
      assert.strictEqual(receivedEvent?.state, 'OPEN');
    });
  });
});
```

### 2.2 Fallback Chain Integration

**File:** `tests/integration/fallback-chain.test.ts`

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LLMAdapterFactory } from '../../src/adapters/adapterFactory.js';
import { FallbackChain } from '../../src/adapters/fallbackChain.js';
import { createMockServer } from '../helpers/mockServer.js';

describe('Fallback Chain Integration', () => {
  it('should failover through entire chain', async () => {
    const servers = {
      openai: createMockServer('openai'),
      anthropic: createMockServer('anthropic'),
      google: createMockServer('google'),
    };

    await Promise.all(Object.values(servers).map(s => s.start()));

    // OpenAI fails, Anthropic fails, Google succeeds
    servers.openai.setErrorSequence([{ status: 500 }]);
    servers.anthropic.setErrorSequence([{ status: 429 }]);
    servers.google.setResponse({
      candidates: [{ content: { parts: [{ text: 'Google success' }] } }],
    });

    const factory = new LLMAdapterFactory({
      defaultProvider: 'openai',
      fallbackChain: ['openai', 'anthropic', 'google'],
      providerConfigs: {
        openai: { apiKey: 'test', baseURL: servers.openai.url },
        anthropic: { apiKey: 'test', baseURL: servers.anthropic.url },
        google: { apiKey: 'test', baseURL: servers.google.url },
      },
    });

    const chain = factory.createFallbackChain('openai');
    const result = await chain.execute({
      nodeId: 'test',
      taskType: 'generate',
      input: { prompt: 'Test' },
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.strictEqual(result.output, 'Google success');
    assert.strictEqual(result.providerUsed, 'google');
    assert.strictEqual(result.attempts, 3);

    await Promise.all(Object.values(servers).map(s => s.stop()));
  });

  it('should cache successful fallback preferences', async () => {
    // After OpenAI fails multiple times, should prefer Anthropic
    const mockHealth = new Map();
    
    const factory = new LLMAdapterFactory({
      defaultProvider: 'openai',
      fallbackChain: ['openai', 'anthropic'],
    });

    // Simulate repeated failures
    for (let i = 0; i < 5; i++) {
      factory.updateHealth('openai', { failures: i + 1 });
    }

    const bestProvider = factory.selectBestProvider(['openai', 'anthropic']);
    assert.ok(bestProvider.name().includes('anthropic'));
  });
});
```

---

## 3. Mocking Strategy

### 3.1 LLM API Mocking

**File:** `tests/helpers/mockServer.ts`

```typescript
import { createServer } from 'http';
import { AddressInfo } from 'net';

export interface MockResponse {
  status?: number;
  body?: any;
  delay?: number;
}

export function createMockServer(provider: string) {
  const responses: MockResponse[] = [];
  let currentIndex = 0;
  let rawResponse: string | null = null;
  let streamingChunks: string[] = [];
  let requestLog: any[] = [];

  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString();
      requestLog.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
        timestamp: Date.now(),
      });

      const response = responses[currentIndex++] || { status: 200 };
      
      if (response.delay) {
        await new Promise(r => setTimeout(r, response.delay));
      }

      if (rawResponse) {
        res.writeHead(response.status || 200, { 'Content-Type': 'text/plain' });
        res.end(rawResponse);
        return;
      }

      if (streamingChunks.length > 0) {
        res.writeHead(200, { 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        });
        
        for (const chunk of streamingChunks) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response.body || {}));
    });
  });

  return {
    url: '',
    requestCount: 0,
    
    async start(): Promise<void> {
      return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address() as AddressInfo;
          this.url = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    },

    async stop(): Promise<void> {
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    },

    setResponse(body: any, status = 200) {
      responses.length = 0;
      currentIndex = 0;
      responses.push({ body, status });
    },

    setErrorSequence(errors: MockResponse[]) {
      responses.length = 0;
      currentIndex = 0;
      responses.push(...errors);
    },

    setDelay(ms: number) {
      if (responses.length > 0) {
        responses[0].delay = ms;
      }
    },

    setRawResponse(raw: string, status = 200) {
      rawResponse = raw;
      responses.push({ status });
    },

    setStreamingResponse(chunks: string[]) {
      streamingChunks = chunks;
    },

    getRequests() {
      return requestLog;
    },

    reset() {
      responses.length = 0;
      currentIndex = 0;
      rawResponse = null;
      streamingChunks = [];
      requestLog = [];
    },
  };
}
```

### 3.2 Redis TestContainers

**File:** `tests/helpers/testContainers.ts`

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers';

let containers: StartedTestContainer[] = [];

export const TestContainers = {
  async startRedis(): Promise<StartedTestContainer & { getHost(): string; getPort(): number }> {
    const container = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withStartupTimeout(30000)
      .start();
    
    containers.push(container);
    
    return {
      ...container,
      getHost: () => container.getHost(),
      getPort: () => container.getMappedPort(6379),
    };
  },

  async startMockLLMServer(): Promise<any> {
    // Returns mock server info
    return {
      url: 'http://localhost:9999',
      setResponse: () => {},
      setErrorSequence: () => {},
    };
  },

  async stopAll(): Promise<void> {
    await Promise.all(containers.map(c => c.stop()));
    containers = [];
  },
};
```

### 3.3 Test Fixtures

**File:** `tests/fixtures/llmResponses.ts`

```typescript
export const openAIResponses = {
  success: {
    id: 'chatcmp-test',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-4-turbo-preview',
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'Hello, I am GPT-4!' },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 7,
      total_tokens: 17,
    },
  },

  rateLimited: {
    error: {
      message: 'Rate limit exceeded',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded',
    },
  },

  authError: {
    error: {
      message: 'Invalid API key',
      type: 'authentication_error',
      code: 'invalid_api_key',
    },
  },
};

export const anthropicResponses = {
  success: {
    id: 'msg-test',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Hello from Claude!' }],
    model: 'claude-3-sonnet-20240229',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 10,
      output_tokens: 5,
    },
  },
};

export const googleResponses = {
  success: {
    candidates: [{
      content: {
        role: 'model',
        parts: [{ text: 'Hello from Gemini!' }],
      },
      finishReason: 'STOP',
      safetyRatings: [],
    }],
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    },
  },
};
```

---

## 4. Performance Testing Strategy

### 4.1 Benchmark Tests

**File:** `tests/perf/cache.bench.ts`

```typescript
import { bench, group, run } from 'mitata';
import { RedisCacheAdapter } from '../../src/cache/redisCacheAdapter.js';
import { LRUCache } from '../../src/cache/lru.js';

const redis = new RedisCacheAdapter({ host: 'localhost', port: 6379 });
const lru = new LRUCache({ maxSize: 10000 });

// Warmup
for (let i = 0; i < 1000; i++) {
  await redis.set(`warmup-${i}`, { data: i });
  lru.set(`warmup-${i}`, { data: i });
}

group('Cache Read Performance', () => {
  bench('Redis GET (small)', async () => {
    await redis.get('warmup-1');
  });

  bench('LRU GET (small)', () => {
    lru.get('warmup-1');
  });

  bench('Redis GET (large - 1KB)', async () => {
    await redis.get('warmup-large');
  });

  bench('LRU GET (large - 1KB)', () => {
    lru.get('warmup-large');
  });
});

group('Cache Write Performance', () => {
  let counter = 0;
  
  bench('Redis SET', async () => {
    await redis.set(`bench-${counter++}`, { data: counter });
  });

  bench('LRU SET', () => {
    lru.set(`bench-${counter++}`, { data: counter });
  });
});

group('Connection Pool', () => {
  bench('Concurrent reads (10)', async () => {
    await Promise.all(Array(10).fill(null).map((_, i) => redis.get(`warmup-${i}`)));
  });

  bench('Concurrent reads (100)', async () => {
    await Promise.all(Array(100).fill(null).map((_, i) => redis.get(`warmup-${i % 1000}`)));
  });
});

await run();
```

### 4.2 Load Tests

**File:** `tests/perf/load.test.ts`

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RedisCacheAdapter } from '../../src/cache/redisCacheAdapter.js';
import { LLMAdapterFactory } from '../../src/adapters/adapterFactory.js';

describe('Load Tests', () => {
  it('should handle 10,000 cache ops/sec', async () => {
    const redis = new RedisCacheAdapter({
      host: 'localhost',
      port: 6379,
      pool: { maxConnections: 20 },
    });

    const start = Date.now();
    const targetOps = 10000;
    const duration = 1000; // 1 second

    let completed = 0;
    const promises: Promise<void>[] = [];

    while (Date.now() - start < duration && completed < targetOps) {
      promises.push(
        redis.set(`key-${completed}`, { data: completed })
          .then(() => completed++)
      );
    }

    await Promise.all(promises);
    const elapsed = Date.now() - start;
    const opsPerSec = (completed / elapsed) * 1000;

    console.log(`Achieved: ${opsPerSec.toFixed(0)} ops/sec`);
    assert.ok(opsPerSec >= 8000, `Expected >= 8000 ops/sec, got ${opsPerSec}`);
  });

  it('should handle 100 concurrent adapter requests', async () => {
    const factory = new LLMAdapterFactory({
      defaultProvider: 'mock',
    });

    const adapter = factory.createProvider('mock');
    
    const requests = Array(100).fill(null).map((_, i) => 
      adapter.run({
        nodeId: `concurrent-${i}`,
        taskType: 'generate',
        input: { prompt: `Test ${i}` },
      })
    );

    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.status === 'SUCCESS').length;

    assert.strictEqual(successCount, 100);
  });

  it('should maintain <50ms p99 latency under load', async () => {
    const redis = new RedisCacheAdapter({ host: 'localhost', port: 6379 });
    
    const latencies: number[] = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await redis.get('test-key');
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p99 = latencies[Math.floor(iterations * 0.99)];

    console.log(`P99 latency: ${p99.toFixed(2)}ms`);
    assert.ok(p99 < 50, `Expected p99 < 50ms, got ${p99}ms`);
  });
});
```

### 4.3 Performance Criteria

| Metric | Target | Alert Threshold | Critical |
|--------|--------|-----------------|----------|
| **Cache Read (p99)** | < 5ms | > 10ms | > 50ms |
| **Cache Write (p99)** | < 10ms | > 20ms | > 100ms |
| **Adapter Response** | < 2s | > 5s | > 10s |
| **Failover Time** | < 500ms | > 1s | > 5s |
| **Connection Pool Util** | < 70% | > 80% | > 95% |
| **Ops/Second** | > 10,000 | < 5,000 | < 1,000 |

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Workflow

**File:** `.github/workflows/v21-tests.yml`

```yaml
name: V2.1 Tests

on:
  push:
    branches: [main, v2.1]
    paths:
      - 'src/cache/**'
      - 'src/adapters/**'
      - 'tests/**'
  pull_request:
    branches: [main, v2.1]
    paths:
      - 'src/cache/**'
      - 'src/adapters/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Unit Tests
        run: npm run test:unit -- --test-name-pattern='RedisCacheAdapter|Adapter|Factory'
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: v21-unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Wait for Redis
        run: |
          until redis-cli -h localhost -p 6379 ping; do
            sleep 1
          done
      
      - name: Run Integration Tests
        run: npm run test:integration
        env:
          TEST_REDIS_HOST: localhost
          TEST_REDIS_PORT: 6379
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: v21-integration

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/v2.1'
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Performance Tests
        run: npm run test:perf
      
      - name: Upload Benchmark Results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: benchmark-results.json

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Run E2E Tests
        run: npm run test:e2e -- --grep 'V2.1'
```

### 5.2 Test Scripts (package.json)

```json
{
  "scripts": {
    "test:unit": "node --test tests/unit/**/*.test.ts",
    "test:integration": "node --test tests/integration/**/*.test.ts",
    "test:e2e": "node --test tests/e2e/**/*.test.ts",
    "test:perf": "node tests/perf/*.bench.ts && node --test tests/perf/*.test.ts",
    "test:v21": "npm run test:unit -- --test-name-pattern='RedisCacheAdapter|Adapter|Factory' && npm run test:integration",
    "test:coverage": "c8 npm run test:v21",
    "test:watch": "node --watch --test tests/unit/**/*.test.ts"
  }
}
```

---

## 6. Coverage Targets

### 6.1 Component Coverage

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|--------------|-----------------|-------------------|
| RedisCacheAdapter | 95% | 90% | 100% |
| ConnectionPool | 95% | 85% | 100% |
| OpenAIAdapter | 90% | 80% | 100% |
| AnthropicAdapter | 90% | 80% | 100% |
| GoogleAdapter | 90% | 80% | 100% |
| LLMAdapterFactory | 95% | 90% | 100% |
| CircuitBreaker | 95% | 90% | 100% |
| FallbackChain | 90% | 85% | 100% |
| **Overall V2.1** | **92%** | **85%** | **100%** |

### 6.2 Coverage Exclusions

```json
{
  "c8": {
    "exclude": [
      "tests/**",
      "dist/**",
      "**/*.test.ts",
      "**/node_modules/**",
      "src/cache/types.ts",
      "src/adapters/types.ts"
    ],
    "reporter": ["text", "lcov", "html"],
    "branches": 85,
    "lines": 92,
    "functions": 100,
    "statements": 92
  }
}
```

---

## 7. Test Data Management

### 7.1 Database Migrations for Tests

```typescript
// tests/helpers/migrations.ts
export async function setupTestDatabase() {
  // Run migrations
  // Seed test data
}

export async function teardownTestDatabase() {
  // Clean up test data
}
```

### 7.2 Redis Key Namespacing

```typescript
// tests/helpers/redis.ts
export function getTestKey(suffix: string): string {
  const testId = process.env.TEST_ID || 'default';
  const timestamp = Date.now();
  return `test:${testId}:${timestamp}:${suffix}`;
}

export async function cleanupTestKeys(redis: RedisCacheAdapter, pattern: string) {
  // Clean up keys matching pattern
}
```

---

## 8. Test Utilities

### 8.1 Assertion Helpers

```typescript
// tests/helpers/assertions.ts
import assert from 'node:assert';

export function assertWithinRange(actual: number, expected: number, tolerance: number) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tolerance, 
    `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

export function assertValidCost(cost: any) {
  assert.ok(typeof cost.tokens === 'number');
  assert.ok(typeof cost.estimatedUSD === 'number');
  assert.ok(cost.tokens >= 0);
  assert.ok(cost.estimatedUSD >= 0);
  assert.ok(typeof cost.provider === 'string');
}

export function assertValidExecutionResult(result: any) {
  assert.ok(['SUCCESS', 'FAILED'].includes(result.status));
  assert.ok(Array.isArray(result.logs));
  assertValidCost(result.cost);
  assert.ok(typeof result.confidence === 'number');
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
}
```

### 8.2 Timing Helpers

```typescript
// tests/helpers/timing.ts
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Condition not met within timeout');
}
```

---

## 9. Test Checklist

### Pre-Release Checklist

- [ ] All unit tests pass (>1000 tests)
- [ ] All integration tests pass (>100 tests)
- [ ] All E2E tests pass (>20 tests)
- [ ] Performance benchmarks meet targets
- [ ] Code coverage >= 90%
- [ ] No flaky tests (run 5x to verify)
- [ ] Memory leak tests pass
- [ ] Load tests handle 10K ops/sec
- [ ] Failover tests complete in <500ms
- [ ] Circuit breaker tests verify all states
- [ ] Rate limiting tests verify throttling
- [ ] Cache invalidation tests pass
- [ ] Pub/sub integration tests pass

---

## 10. Implementation Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| **Week 1** | 5 days | Unit tests for RedisCacheAdapter |
| **Week 2** | 5 days | Unit tests for LLM Adapters + mocking |
| **Week 3** | 5 days | Adapter Factory + Circuit Breaker tests |
| **Week 4** | 5 days | Integration tests + TestContainers |
| **Week 5** | 5 days | Performance tests + benchmarks |
| **Week 6** | 5 days | E2E tests + CI/CD integration |

---

## 📚 References

- [ADR-008: V2.1 Cache Layer and Adapter Factory](./architecture/ADR-008-v21-cache-and-adapters.md)
- [Base Testing Strategy](./TESTING-STRATEGY.md)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [TestContainers](https://node.testcontainers.org/)
- [Mitata Benchmark](https://github.com/evanwashere/mitata)

---

**Testing Strategy Version:** 1.0  
**Last Updated:** 2026-04-14  
**Next Review:** 2026-04-28
