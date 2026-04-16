# ADR-008: V2.1 Cache Layer and Adapter Factory Pattern

**Status:** 📝 Proposed  
**Date:** 2026-04-14  
**Decision Owner:** @CTO Agent  
**Stakeholders:** Core Team, Runtime Team, Infrastructure Team  
**Target Release:** V2.1.0-alpha (May 2024)

---

## Context

Ultra-Dex V2.0 has established a solid foundation with:
- **Multi-provider LLM support:** OpenAI, Anthropic, and Google Gemini adapters
- **3-tier memory architecture:** Instant (in-process), Session (Redis), and Persistent (Postgres)
- **DexGraph orchestration:** Deterministic workflow execution with clear component boundaries

V2.1 introduces requirements for:
1. **Redis cache adapter** for high-performance workflow state caching
2. **Adapter factory pattern** to simplify LLM provider switching and extensibility
3. **Performance optimizations** for high-throughput workflows

Current pain points:
- Adapters are instantiated directly, making provider switching cumbersome
- No centralized connection pooling for Redis/session memory
- Cache invalidation strategies are ad-hoc
- Limited fallback mechanisms when providers fail

---

## Decision

### 1. Redis Cache Adapter Architecture

Implement a `RedisCacheAdapter` that integrates with ADR-004's Tier 2 (Session Memory) while extending capabilities for workflow state caching.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Cache Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │   Workflow       │      │   Pub/Sub        │                 │
│  │   State Cache    │      │   Real-time      │                 │
│  │   (Hash)         │      │   Updates        │                 │
│  └────────┬─────────┘      └────────┬─────────┘                 │
│           │                         │                           │
│           ▼                         ▼                           │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Redis Connection Pool (ioredis)          │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │          │
│  │  │ Conn 1   │  │ Conn 2   │  │ Conn N   │       │          │
│  │  │ (active) │  │ (active) │  │ (standby)│       │          │
│  │  └──────────┘  └──────────┘  └──────────┘       │          │
│  └─────────────────────────┬────────────────────────┘          │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │          Redis Sentinel / Cluster Mode           │          │
│  │         (High Availability Option)               │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Boundaries for Cache Layer

| Component | Responsibility | Boundary |
|-----------|---------------|----------|
| `RedisCacheAdapter` | Core Redis operations, serialization | Implements `CacheAdapter` interface |
| `ConnectionPool` | Connection lifecycle, health checks | Managed by adapter, hidden from consumers |
| `CacheKeyManager` | Key namespacing, versioning | Utility class, pure functions |
| `InvalidationStrategy` | TTL, tag-based, pattern-based | Strategy pattern implementation |
| `PubSubManager` | Real-time cache updates | Optional, for multi-instance sync |

### 2. Adapter Factory Pattern

Implement a factory pattern for LLM adapter creation and management.

```typescript
// Factory interface
interface AdapterFactory {
  createProvider(type: ProviderType, config: ProviderConfig): ExecutionAdapter;
  getDefaultProvider(): ExecutionAdapter;
  createFallbackChain(primary: ProviderType): FallbackChain;
  registerProvider(type: ProviderType, constructor: AdapterConstructor): void;
}

// Usage
const factory = new LLMAdapterFactory({
  defaultProvider: 'openai',
  fallbackChain: ['anthropic', 'google', 'local'],
  circuitBreaker: true,
});

const adapter = factory.createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
});
```

#### Factory Pattern Design

```
┌─────────────────────────────────────────────────────────────────┐
│                Adapter Factory Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           LLMAdapterFactory                          │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │      │
│  │  │  Registry   │  │  Provider   │  │  Circuit    │  │      │
│  │  │  (Map)      │  │  Selector   │  │  Breaker    │  │      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │      │
│  └────────────────────┬─────────────────────────────────┘      │
│                       │                                          │
│         ┌─────────────┼─────────────┐                           │
│         ▼             ▼             ▼                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ OpenAI   │  │Anthropic │  │  Google  │  ... more            │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Fallback Chain                             │      │
│  │  Primary → Fallback #1 → Fallback #2 → Local LLM    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Performance Optimizations

#### Connection Pooling

```typescript
interface RedisPoolConfig {
  minConnections: number;      // Default: 2
  maxConnections: number;      // Default: 10
  acquireTimeout: number;      // Default: 5000ms
  idleTimeout: number;         // Default: 30000ms
  retryStrategy: (attempts: number) => number | null;
}
```

#### Cache Invalidation Strategies

| Strategy | Use Case | Implementation |
|----------|----------|----------------|
| **TTL-based** | Time-bound data (sessions, tokens) | Redis EXPIRE |
| **Tag-based** | Grouped invalidation (workflow data) | Tag index in Redis Set |
| **Pattern-based** | Bulk invalidation (version changes) | SCAN + DEL |
| **Event-driven** | Real-time sync across instances | Redis Pub/Sub |

#### Fallback Mechanisms

```
Request Flow with Fallbacks:

User Request
    ↓
┌─────────────────────┐
│ Circuit Breaker     │──┐
│ (Closed?)           │  │ Open → Return cached or error
└─────────────────────┘  │
    ↓                    │
┌─────────────────────┐  │
│ Primary Provider    │  │
│ (e.g., OpenAI)      │──┤ Failure
└─────────────────────┘  │
    ↓ Success            │
   Return                │
                         │
    ┌────────────────────┘
    ↓
┌─────────────────────┐
│ Fallback #1         │──┐
│ (e.g., Anthropic)   │  │ Failure
└─────────────────────┘  │
    ↓ Success            │
   Return                │
                         │
    ┌────────────────────┘
    ↓
┌─────────────────────┐
│ Fallback #2         │──┐
│ (e.g., Google)      │  │ Failure
└─────────────────────┘  │
    ↓ Success            │
   Return                │
                         │
    ┌────────────────────┘
    ↓
┌─────────────────────┐
│ Local LLM           │
│ (Ollama)            │
└─────────────────────┘
    ↓
   Return (degraded)
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Ultra-Dex V2.1                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Layer                                   │   │
│  │         (REST / WebSocket / SDK)                                │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                            │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │                  Adapter Factory Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Adapter   │  │   Circuit   │  │    Fallback Chain       │  │   │
│  │  │   Registry  │  │   Breaker   │  │    Manager              │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                            │
│         ┌───────────────────┼───────────────────┐                       │
│         ▼                   ▼                   ▼                       │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐                  │
│  │  OpenAI    │     │ Anthropic  │     │   Google   │  ... more        │
│  │  Adapter   │     │  Adapter   │     │  Adapter   │                  │
│  └────────────┘     └────────────┘     └────────────┘                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Cache Layer (Tier 2)                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  Redis Cache    │  │  Connection     │  │  Invalidation   │  │   │
│  │  │  Adapter        │  │  Pool           │  │  Strategy       │  │   │
│  │  │                 │  │                 │  │                 │  │   │
│  │  │ • Workflow State│  │ • min: 2        │  │ • TTL-based     │  │   │
│  │  │ • Session Data  │  │ • max: 10       │  │ • Tag-based     │  │   │
│  │  │ • Pub/Sub       │  │ • health checks │  │ • Pattern-based │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     DexGraph Core                                │   │
│  │         (Parser → Graph → Scheduler → State Machine)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Memory Tiers (ADR-004)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │   │
│  │  │  Tier 1  │  │  Tier 2  │  │  Tier 3  │                      │   │
│  │  │ (Instant)│  │ (Redis)  │  │(Postgres)│                      │   │
│  │  └──────────┘  └──────────┘  └──────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Redis Cache Adapter Interface

```typescript
interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

interface RedisCacheOptions extends CacheOptions {
  ttl?: number;              // seconds
  tags?: string[];           // for tag-based invalidation
  nx?: boolean;              // only if not exists
  xx?: boolean;              // only if exists
}

class RedisCacheAdapter implements CacheAdapter {
  private pool: RedisConnectionPool;
  private keyManager: CacheKeyManager;
  private invalidator: InvalidationStrategy;
  
  constructor(config: RedisCacheConfig) {
    this.pool = new RedisConnectionPool(config.pool);
    this.keyManager = new CacheKeyManager(config.namespace);
    this.invalidator = createInvalidationStrategy(config.invalidation);
  }
  
  async getWorkflowState(workflowId: string): Promise<WorkflowState | undefined> {
    const key = this.keyManager.workflowState(workflowId);
    const data = await this.pool.execute(redis => redis.hgetall(key));
    return data ? deserializeWorkflowState(data) : undefined;
  }
  
  async setWorkflowState(workflowId: string, state: WorkflowState): Promise<void> {
    const key = this.keyManager.workflowState(workflowId);
    await this.pool.execute(redis => 
      redis.hset(key, serializeWorkflowState(state))
    );
    await this.invalidator.applyTTL(key, { tags: ['workflow', workflowId] });
  }
  
  async invalidateByTag(tag: string): Promise<void> {
    await this.invalidator.invalidateByTag(tag);
  }
}
```

### Adapter Factory Implementation

```typescript
class LLMAdapterFactory implements AdapterFactory {
  private registry = new Map<string, AdapterConstructor>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private config: FactoryConfig;
  
  constructor(config: FactoryConfig) {
    this.config = config;
    this.registerBuiltInProviders();
  }
  
  registerProvider(type: string, constructor: AdapterConstructor): void {
    this.registry.set(type, constructor);
    if (this.config.circuitBreaker) {
      this.circuitBreakers.set(type, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
      }));
    }
  }
  
  createProvider(type: string, config: ProviderConfig): ExecutionAdapter {
    const Constructor = this.registry.get(type);
    if (!Constructor) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    
    const adapter = new Constructor(config);
    
    if (this.config.circuitBreaker) {
      const cb = this.circuitBreakers.get(type)!;
      return new CircuitBreakerAdapter(adapter, cb);
    }
    
    return adapter;
  }
  
  createFallbackChain(primary: string): FallbackChain {
    const providers = this.config.fallbackChain
      .map(type => this.createProvider(type, this.config.providerConfigs[type]))
      .filter(Boolean);
    
    return new FallbackChain([providers[0], ...providers.slice(1)]);
  }
  
  private registerBuiltInProviders(): void {
    this.registerProvider('openai', OpenAIAdapter);
    this.registerProvider('anthropic', AnthropicAdapter);
    this.registerProvider('google', GoogleAdapter);
    this.registerProvider('cohere', CohereAdapter);
    this.registerProvider('mistral', MistralAdapter);
    this.registerProvider('ollama', OllamaAdapter);
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: number;
  
  constructor(private config: CircuitBreakerConfig) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError();
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }
}
```

---

## Performance Considerations

### Throughput Targets

| Metric | V2.0 Baseline | V2.1 Target | Improvement |
|--------|--------------|-------------|-------------|
| Workflow executions/sec | 100 | 500 | **5x** |
| Cache read latency (p99) | 50ms | 5ms | **90%** |
| Cache write latency (p99) | 100ms | 10ms | **90%** |
| Provider failover time | 5s | 500ms | **90%** |
| Connection pool utilization | N/A | <80% | **Healthy** |

### Optimization Strategies

1. **Connection Pooling**
   - Maintain persistent connections to Redis
   - Health checks every 30s
   - Auto-reconnect on failure

2. **Pipeline Batching**
   - Batch multiple Redis operations
   - Pipeline threshold: 10 commands or 10ms

3. **Lazy Loading**
   - Load workflow state on-demand
   - Prefetch next 3 nodes in execution graph

4. **Compression**
   - LZ4 compression for large workflow states
   - Compression threshold: 1KB

5. **Monitoring**
   - Cache hit/miss ratios per namespace
   - Connection pool metrics
   - Provider latency and error rates

---

## Consequences

### ✅ Positive

| Aspect | Benefit |
|--------|---------|
| **Scalability** | Connection pooling enables 5x throughput increase |
| **Reliability** | Circuit breakers prevent cascading failures |
| **Flexibility** | Factory pattern makes adding providers trivial |
| **Performance** | Sub-10ms cache operations with Redis |
| **Maintainability** | Clear interfaces and separation of concerns |
| **Observability** | Built-in metrics for cache and provider health |

### ❌ Negative

| Aspect | Cost |
|--------|------|
| **Complexity** | Additional abstraction layers |
| **Infrastructure** | Redis cluster required for HA |
| **Learning Curve** | Developers must understand factory pattern |
| **Debugging** | More layers to trace through |

### 🔄 Neutral

- **Redis Dependency:** Required for production, optional for development (in-memory fallback)
- **Configuration:** More knobs to tune, but sensible defaults provided

---

## Alternatives Considered

### Option 1: Direct Adapter Instantiation (Current V2.0)

Keep existing pattern of direct adapter instantiation.

**Verdict:** ❌ Rejected. Doesn't address provider switching or fallback needs.

### Option 2: Service Locator Pattern

Use a service locator for adapter discovery.

**Verdict:** ❌ Rejected. Hidden dependencies make testing harder.

### Option 3: Factory + Circuit Breaker + Connection Pool (Selected)

Explicit factory with resilience patterns built-in.

**Verdict:** ✅ Accepted. Clear interfaces, testable, scalable.

### Option 4: External Cache (Memcached)

Use Memcached instead of Redis.

**Verdict:** ❌ Rejected. Redis provides pub/sub and data structures needed for workflow state.

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Create `CacheAdapter` interface
- [ ] Implement `RedisCacheAdapter` with ioredis
- [ ] Add connection pool management
- [ ] Unit tests with TestContainers

### Phase 2: Factory Pattern (Week 3)
- [ ] Create `LLMAdapterFactory`
- [ ] Migrate existing adapters to factory
- [ ] Implement circuit breaker wrapper
- [ ] Update V2.0 code to use factory

### Phase 3: Fallback & Resilience (Week 4)
- [ ] Implement `FallbackChain`
- [ ] Add provider health checks
- [ ] Integration tests for failover scenarios
- [ ] Metrics and alerting

### Phase 4: Performance Optimization (Week 5)
- [ ] Pipeline batching
- [ ] Compression for large states
- [ ] Prefetch optimization
- [ ] Benchmark suite

---

## Validation Criteria

- [ ] Redis adapter passes 10,000 ops/sec load test
- [ ] Provider failover completes in <500ms
- [ ] Cache hit rate >90% for workflow state
- [ ] All V2.0 tests pass with factory migration
- [ ] New provider added in <50 lines of code
- [ ] Connection pool stays <80% utilization under load

---

## References

- [ADR-003: Multi-Provider AI Routing](./ADR-003-ai-provider-routing.md)
- [ADR-004: 3-Tier Memory Architecture](./ADR-004-three-tier-memory.md)
- [ADR-007: DexGraph Component Boundaries](./ADR-007-dexgraph-component-boundaries-v2.md)
- [V2.1 Roadmap](../../../V2.1-ROADMAP.md)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

**Last Updated:** 2026-04-14  
**Version:** 1.0
