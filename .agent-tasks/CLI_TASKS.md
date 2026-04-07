# CLI-Codex Task Assignment - Diamond State v3.0.0

## 🎉 EXCELLENT NEWS!

The migration has achieved **CRITICAL MASS** at 85% completion!

### Current Status
- **TypeScript Files**: 289 (85%)
- **JavaScript Files**: 53 (15% remaining)
- **Type Errors**: 0 ✅
- **Validation**: 32/32 passing ✅
- **Core Directories**: ALL 100% COMPLETE ✅

Your previous work (AI Layer) is DONE and perfect!

---

## 🎯 YOUR NEW ASSIGNMENT: Integration Testing

### Scope
Create comprehensive integration tests for the new Diamond State architecture.

### Why This Matters
The architecture is complete but needs testing to ensure:
- Distributed mesh works correctly
- Streaming functions as expected
- MCP sandbox is secure
- Self-healing triggers properly

---

## 📋 Test Files to Create

### 1. Distributed Mesh Tests
**File**: `tests/core/mesh/integration.test.ts`

```typescript
// Test: Redis Adapter
- Connect to Redis
- Publish/subscribe messages
- Request/reply pattern
- Reconnection after disconnect

// Test: Kafka Adapter  
- Connect to Kafka
- Producer/Consumer
- Topic auto-creation
- Message persistence

// Test: Worker Pool
- Worker registration
- Heartbeat monitoring
- Task assignment
- Auto-failover

// Test: Load Balancer
- Round-robin routing
- Least-loaded selection
- Geographic affinity
- Capability matching
```

### 2. Streaming Tests
**File**: `tests/core/streaming/integration.test.ts`

```typescript
// Test: WebSocket Streaming
- Client connection
- Event broadcasting
- Session management
- Reconnection

// Test: SSE Handler
- SSE endpoint
- Event streaming
- Connection cleanup
- Heartbeat
```

### 3. MCP Tests
**File**: `tests/core/mcp/integration.test.ts`

```typescript
// Test: Plugin Sandbox
- Code execution
- Security validation
- Permission enforcement
- Timeout handling

// Test: App Store
- Plugin publishing
- Search/discovery
- Install/uninstall
- Version management
```

---

## 📋 Testing Process

### Step 1: Create Test Structure
```bash
# Create test files
touch tests/core/mesh/integration.test.ts
touch tests/core/streaming/integration.test.ts
touch tests/core/mcp/integration.test.ts
```

### Step 2: Write Tests
Use the existing test patterns:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RedisMessageBus } from '../../../src/core/mesh/redis-adapter.js';

describe('Distributed Mesh', () => {
  let bus: RedisMessageBus;
  
  beforeEach(async () => {
    bus = new RedisMessageBus(mockLogger);
    await bus.connect();
  });
  
  afterEach(async () => {
    await bus.disconnect();
  });
  
  it('should publish and receive messages', async () => {
    const received: unknown[] = [];
    await bus.subscribe('test', (msg) => received.push(msg));
    await bus.publish('test', { data: 'hello' });
    
    expect(received).toHaveLength(1);
  });
});
```

### Step 3: Run Tests
```bash
# Run all tests
npm run test:unit

# Run specific tests
npm run test:unit -- tests/core/mesh/
npm run test:unit -- tests/core/streaming/
npm run test:unit -- tests/core/mcp/
```

---

## 🚨 IMPORTANT PATTERNS

### Pattern 1: Mock External Services
```typescript
// Mock Redis/Kafka for unit tests
const mockRedis = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  // etc.
};
```

### Pattern 2: Test Setup/Teardown
```typescript
beforeEach(async () => {
  // Setup test environment
});

afterEach(async () => {
  // Cleanup
  await service.shutdown();
});
```

### Pattern 3: Async Testing
```typescript
it('should handle async operations', async () => {
  const result = await service.doSomething();
  expect(result).toBeDefined();
});
```

---

## ✅ SUCCESS CRITERIA

- [ ] 3 integration test files created
- [ ] >80% test coverage for new architecture
- [ ] All tests passing
- [ ] Mock external dependencies (Redis, Kafka)
- [ ] Document test setup requirements

---

## 🆘 ESCALATION

Escalate to Kimi if:
- Test infrastructure issues
- Complex mocking requirements
- Need test database/setup

Post in `.agent-tasks/ESCALATIONS.md`

---

## ⏱️ TIMELINE

**Target**: 4-6 hours
**Priority**: HIGH (ensure architecture is solid!)

Testing is critical for the v3.0.0 release! 🧪
