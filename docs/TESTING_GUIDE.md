# Ultra-Dex Testing Guide

**Quick reference for the Ultra-Dex test suite**

## Quick Start

```bash
# Run all tests
cd cli && npm test

# Run specific category
node --test test/auth/*.test.js      # Security tests
node --test test/memory/*.test.js    # Memory tests
node --test test/graph/*.test.js     # Graph tests

# With coverage
npm run test:coverage
```

## Test Structure

```
cli/test/
├── auth/       # Security (170 tests)
├── memory/     # Memory System (132 tests)
├── graph/      # Graph & RAG (105 tests)
├── providers/  # AI Providers (8 tests)
├── router/     # Model Router (41 tests)
├── utils/      # Utilities (48 tests)
└── commands/   # Commands (13 tests)

Total: 85+ files, 737+ tests
```

## Test Categories

### 🔒 Security (170 tests)

- API key management (generation, validation, revocation)
- RBAC with 4 roles (ADMIN, MAINTAINER, MEMBER, VIEWER)
- Secure token storage with encryption
- Configuration validation

### 🧠 Memory (132 tests)

- Hot-warm-cold tiered architecture
- Vector embeddings (hash-based)
- SQLite vector store with cosine similarity
- Memory compression

### 🕸️ Graph (105 tests)

- Semantic knowledge graph
- Concept extraction and domain inference
- FalkorDB/Redis client
- Cypher query generation

### 🤖 Providers (49 tests)

- Provider resolution (OpenAI, Claude, Gemini)
- Smart task-based routing
- Cost optimization
- Fallback chains

## Writing Tests

```javascript
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

describe('MyFeature', () => {
  test('should work correctly', () => {
    const result = myFunction('input');
    assert.strictEqual(result, 'expected');
  });

  test('should handle edge cases', () => {
    assert.throws(() => myFunction(null), TypeError);
  });
});
```

## Coverage Goals

| Module   | Current | Target | Status         |
| -------- | ------- | ------ | -------------- |
| Security | 70%+    | 70%    | ✅ Met         |
| Memory   | 70%+    | 70%    | ✅ Met         |
| Graph    | 70%+    | 70%    | ✅ Met         |
| Overall  | ~60%    | 70%    | 🟡 In Progress |

## Resources

- [Full Test Documentation](../cli/test/README.md)
- [Coverage Report](../TEST_COVERAGE_REPORT.md)
- [Node.js Test Runner](https://nodejs.org/api/test.html)

---

_Last Updated: February 5, 2026_
_Test Count: 737+_
