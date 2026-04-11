# 🧪 Ultra-Dex Testing Strategy

**Version:** 3.1.0  
**Date:** 2026-04-10  
**Status:** Active  
**Coverage Target:** 85%+

---

## 📊 Testing Pyramid

```
        /\
       /  \     E2E Tests (5%)
      /____\    - Full workflows
     /      \   - User journeys
    /________\  - Critical paths
   /          \
  /____________\ Integration Tests (20%)
  |            | - Component interactions
  |            | - API contracts
  |            | - Database operations
  |____________|
 /              \
/________________\ Unit Tests (75%)
|                | - Functions/methods
|                | - Business logic
|                | - Edge cases
|________________|
```

---

## 🎯 Testing Philosophy

1. **Fast Feedback** - Tests should run in <2 minutes
2. **Reliable** - No flaky tests
3. **Isolated** - Tests don't depend on each other
4. **Maintainable** - Tests are code too
5. **Meaningful** - Tests catch real bugs

---

## 1. Unit Testing Strategy

### Scope

- Individual functions/methods
- Pure business logic
- Edge cases and error handling
- Utility functions

### Structure

```
tests/
├── core/
│   ├── orchestration.test.js
│   ├── memory.test.js
│   ├── ai-meta-layer.test.js
│   └── governance.test.js
├── services/
│   ├── ai-providers/
│   ├── auth/
│   └── cache/
└── utils/
    ├── error-handler.test.js
    └── logging.test.js
```

### Naming Convention

```javascript
// File: src/core/orchestration/index.js
// Test: tests/core/orchestration.test.js

describe('AgentOrchestrator', () => {
  describe('executeTask', () => {
    it('should execute simple task successfully', async () => {});
    it('should handle task timeout', async () => {});
    it('should retry on transient failure', async () => {});
    it('should throw on permanent failure', async () => {});
  });
});
```

### Unit Test Template

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgentOrchestrator } from '../../src/core/orchestration/index.js';

describe('FeatureName', () => {
  // Setup
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  afterEach(async () => {
    await orchestrator.cleanup();
  });

  describe('methodName', () => {
    it('should do X when Y', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await orchestrator.method(input);

      // Assert
      assert.strictEqual(result.status, 'success');
      assert.ok(result.data);
    });

    it('should throw error for invalid input', async () => {
      await assert.rejects(async () => await orchestrator.method(null), /Invalid input/);
    });
  });
});
```

### Mocking Strategy

```javascript
// Mock external dependencies
const mockProvider = {
  generate: async () => ({ content: 'mock response', usage: {} }),
  isHealthy: () => true,
};

// Mock with sinon (if needed)
import sinon from 'sinon';
const stub = sinon.stub(provider, 'generate').resolves(mockResponse);
```

---

## 2. Integration Testing Strategy

### Scope

- Component interactions
- Database operations
- API endpoints
- External service calls (with mocks)

### Structure

```
tests/integration/
├── orchestration/
│   ├── agent-swarm.test.js
│   └── task-graph.test.js
├── ai/
│   ├── provider-routing.test.js
│   └── fallback-chain.test.js
├── memory/
│   ├── three-tier.test.js
│   └── vector-search.test.js
└── api/
    ├── endpoints.test.js
    └── authentication.test.js
```

### Integration Test Pattern

```javascript
// Test full workflow
describe('Task Execution Flow', () => {
  it('should execute task through full pipeline', async () => {
    // 1. Create task
    const task = await createTask({
      type: 'generate',
      prompt: 'Hello',
    });

    // 2. Route to provider
    const provider = await router.select(task);

    // 3. Execute
    const result = await provider.generate(task.messages);

    // 4. Store in memory
    await memory.store(task.id, result);

    // 5. Verify
    const stored = await memory.retrieve(task.id);
    assert.deepEqual(stored, result);
  });
});
```

### Database Integration

```javascript
// Use test database
describe('Database Operations', () => {
  before(async () => {
    await setupTestDatabase();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  it('should persist task results', async () => {
    const task = { id: 'test-123', result: 'data' };
    await db.insert('tasks', task);

    const retrieved = await db.select('tasks', { id: 'test-123' });
    assert.deepEqual(retrieved, task);
  });
});
```

---

## 3. E2E Testing Strategy

### Scope

- Full user workflows
- CLI commands
- Critical paths only
- Happy path + error scenarios

### Structure

```
tests/e2e/
├── cli/
│   ├── init.test.js
│   ├── run.test.js
│   └── swarm.test.js
├── api/
│   ├── health.test.js
│   └── workflow.test.js
└── critical-paths/
    ├── auth-flow.test.js
    └── task-execution.test.js
```

### E2E Test Pattern

```javascript
// CLI E2E test
describe('CLI: ultra-dex init', () => {
  it('should initialize project', async () => {
    const { stdout, exitCode } = await execa('ultra-dex', ['init', '--yes'], {
      cwd: tempDir,
    });

    assert.strictEqual(exitCode, 0);
    assert.ok(stdout.includes('Project initialized'));
    assert.ok(fs.existsSync(path.join(tempDir, '.ultra/config.json')));
  });
});

// API E2E test
describe('API: /execute', () => {
  it('should execute task via API', async () => {
    const response = await fetch('http://localhost:3000/execute', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ task: 'generate', input: 'Hello' }),
    });

    assert.strictEqual(response.status, 200);
    const result = await response.json();
    assert.ok(result.content);
  });
});
```

---

## 4. Performance Testing Strategy

### Load Tests

```javascript
// tests/performance/load.test.js
import { describe, it } from 'node:test';
import { loadTest } from './helpers/load.js';

describe('Load Tests', () => {
  it('should handle 100 concurrent tasks', async () => {
    const results = await loadTest({
      concurrent: 100,
      duration: '30s',
      fn: () => orchestrator.executeTask({ type: 'generate' }),
    });

    assert.ok(results.successRate > 0.99);
    assert.ok(results.p95Latency < 2000);
  });
});
```

### Benchmark Tests

```javascript
// Benchmark critical operations
import { bench, run } from 'mitata';

bench('generate task', async () => {
  await orchestrator.executeTask({ type: 'generate', input: 'test' });
});

await run();
```

### Performance Budgets

| Metric      | Target  | Alert   | Critical |
| ----------- | ------- | ------- | -------- |
| Unit Test   | < 100ms | > 200ms | > 500ms  |
| Integration | < 2s    | > 5s    | > 10s    |
| E2E         | < 10s   | > 20s   | > 30s    |
| Memory      | < 100MB | > 200MB | > 500MB  |

---

## 5. Security Testing Strategy

### Static Analysis

```bash
# Run security scanners
npm audit
snyk test
semgrep --config=auto
```

### Input Validation Tests

```javascript
describe('Security: Input Validation', () => {
  it('should reject XSS attempts', async () => {
    const malicious = '<script>alert("xss")</script>';
    await assert.rejects(async () => await orchestrator.executeTask({ input: malicious }));
  });

  it('should sanitize SQL injection attempts', async () => {
    const injection = "'; DROP TABLE users; --";
    const result = await db.query(injection);
    // Should be escaped, not executed
    assert.ok(!result.error);
  });
});
```

### Authentication/Authorization Tests

```javascript
describe('Security: Auth', () => {
  it('should reject unauthorized requests', async () => {
    const response = await fetch('/api/admin', {
      headers: {
        /* no auth */
      },
    });
    assert.strictEqual(response.status, 401);
  });
});
```

---

## 6. Test Data Strategy

### Fixtures

```javascript
// tests/fixtures/tasks.js
export const validTask = {
  id: 'task-001',
  type: 'generate',
  input: 'Hello, world!',
  options: { temperature: 0.7 },
};

export const invalidTask = {
  id: 'task-002',
  type: 'unknown',
  input: null,
};

export const mockProviderResponse = {
  content: 'Generated text',
  usage: { prompt_tokens: 10, completion_tokens: 20 },
};
```

### Factories

```javascript
// tests/factories/task.js
export function createTask(overrides = {}) {
  return {
    id: `task-${Date.now()}`,
    type: 'generate',
    input: 'Test input',
    createdAt: new Date(),
    ...overrides,
  };
}
```

### Test Isolation

```javascript
// Each test gets fresh data
beforeEach(async () => {
  await db.truncate('tasks');
  await db.truncate('memory');
});
```

---

## 7. Coverage Strategy

### Goals

| Type       | Target | Minimum |
| ---------- | ------ | ------- |
| Lines      | 85%    | 80%     |
| Functions  | 85%    | 80%     |
| Branches   | 75%    | 70%     |
| Statements | 85%    | 80%     |

### Coverage Exclusions

```json
// package.json
{
  "c8": {
    "exclude": ["tests/**", "dist/**", "**/*.test.js", "**/node_modules/**"]
  }
}
```

### Coverage Report

```bash
npm run test:coverage
# Generates:
# - coverage/lcov-report/index.html (HTML)
# - coverage/lcov.info (for CI)
```

---

## 8. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis
        ports:
          - 6379:6379
      postgres:
        image: postgres
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

### Pre-commit Hooks

```yaml
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test:unit -- --changed
```

---

## 9. Test Utilities

### Helpers

```javascript
// tests/helpers/index.js
export async function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockProvider(response) {
  return {
    generate: async () => response,
    isHealthy: () => true,
  };
}

export async function withTimeout(fn, ms) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]);
}
```

### Assertions

```javascript
// tests/helpers/assertions.js
import assert from 'node:assert';

export function assertContains(haystack, needle) {
  assert.ok(haystack.includes(needle), `Expected "${haystack}" to contain "${needle}"`);
}

export function assertIsUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidRegex.test(str), `Expected UUID, got "${str}"`);
}
```

---

## 10. Flaky Test Prevention

### Common Causes & Fixes

| Cause             | Fix                                |
| ----------------- | ---------------------------------- |
| Timing issues     | Use explicit waits, not setTimeout |
| Shared state      | Isolate test data                  |
| External services | Mock consistently                  |
| Random failures   | Seed random generators             |
| Resource leaks    | Cleanup in afterEach               |

### Retry Strategy

```javascript
// Only for truly flaky tests
const retryTest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await waitFor(100 * (i + 1)); // Exponential backoff
    }
  }
};
```

---

## 📊 Test Metrics Dashboard

Track these metrics:

| Metric            | Current | Target |
| ----------------- | ------- | ------ |
| **Test Count**    | 498     | 600+   |
| **Pass Rate**     | 100%    | >99%   |
| **Flaky Tests**   | 0       | 0      |
| **Coverage**      | 75%     | 85%    |
| **Test Duration** | 70s     | <60s   |
| **New Bugs/Week** | 5       | <3     |

---

## ✅ Testing Checklist

Before releasing:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage targets met
- [ ] No security vulnerabilities
- [ ] Performance benchmarks pass
- [ ] No flaky tests
- [ ] Documentation updated

---

## 📝 References

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Testing Best Practices](./docs/guides/testing/BEST_PRACTICES.md)
- [Test Examples](./tests/examples/)

---

**Testing strategy version:** 1.0  
**Last updated:** 2026-04-10
