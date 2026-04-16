# Security Fixes for Ultra-Dex

## Quick Reference: Critical Issues and Fixes

---

## 🔴 CRITICAL: Insecure ID Generation

### Problem

`Math.random()` is used in 110+ locations for generating sensitive IDs.

### Affected Files

- `src/core/memory/unified-api.ts:474`
- `src/core/memory/vector-store.ts:53`
- `src/core/orchestration/orchestrator.ts:102`
- `src/core/ai/ai-meta-layer.ts:114`

### Fix

Replace with cryptographically secure random generation:

```typescript
// BEFORE (INSECURE):
_generateId() {
  return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// AFTER (SECURE):
import { randomUUID } from 'crypto';

_generateId() {
  return `ctx_${randomUUID()}`;
}
```

### Automated Fix Script

```bash
# Replace Math.random() ID generation in critical files
sed -i "s/Math.random().toString(36).substr(2, 9)/randomUUID()/g" \
  src/core/memory/unified-api.ts

# For orchestrator taskId
sed -i "s/\`orchestrated_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`/\`orchestrated_\${randomUUID()}\`/g" \
  src/core/orchestration/orchestrator.ts
```

---

## 🔴 HIGH: Missing Input Validation

### Problem

AI Meta Layer accepts untrusted input without validation.

### Location

`src/core/ai/ai-meta-layer.ts` - `call()` method

### Fix

```typescript
// Add validation schema
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().max(1_000_000), // 1MB limit
});

const OptionsSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().max(128_000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

async call(model: unknown, messages: unknown[], options: unknown = {}) {
  // Validate inputs
  const validatedMessages = z.array(MessageSchema).parse(messages);
  const validatedOptions = OptionsSchema.parse(options);

  // Continue with validated data
  return this.executeCall(
    typeof model === 'string' ? model : 'default',
    validatedMessages,
    validatedOptions
  );
}
```

---

## 🔴 HIGH: SQL N+1 Query Pattern

### Problem

Individual UPDATE statements in a loop.

### Location

`src/core/memory/unified-api.ts:397-401`

### Fix

```typescript
// BEFORE (N+1):
rows.forEach((row) => {
  db.run(
    `UPDATE context SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?`,
    [row.id]
  );
});

// AFTER (BATCHED):
async _updateAccessCounts(ids: string[]) {
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE context
    SET access_count = access_count + 1,
        last_accessed = CURRENT_TIMESTAMP
    WHERE id IN (${placeholders})`;

  return new Promise((resolve, reject) => {
    db.run(sql, ids, (err) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
}

// Usage in _querySQLite:
const ids = rows.map(row => row.id);
await this._updateAccessCounts(ids);
```

---

## 🟡 MEDIUM: Rate Limiter Lease Leak

### Problem

Rate limiter lease not released on error.

### Location

`src/core/ai/ai-meta-layer.ts:252-272`

### Fix

```typescript
// Ensure lease is always released
async executeProviderCall(providerName, provider, model, messages, options = {}) {
  const lease = this.rateLimiter
    ? await this.rateLimiter.acquire(providerName, {
        wait: options.rateLimitWait !== false,
        timeoutMs: options.rateLimitTimeoutMs,
      })
    : null;

  try {
    const client = await this.ensureProviderClient(provider);
    const providerModel = client(model || provider.defaultModel);
    const { rateLimitWait, rateLimitTimeoutMs, ...providerOptions } = options;
    return await providerModel.call({
      model: providerModel,
      messages,
      ...providerOptions,
    });
  } finally {
    // Guaranteed to release even on error
    if (lease) {
      this.rateLimiter.release(lease);
    }
  }
}
```

---

## 🟡 MEDIUM: Type Safety Issues

### Problem

Missing type declarations causing LSP errors.

### Location

Multiple files with `any` types

### Fix Pattern

```typescript
// BEFORE:
constructor(config = {}) {
  this.config = { ... };
}

// AFTER:
interface UnifiedMemoryConfig {
  sqlite?: { database: string };
  chroma?: { url: string };
  neo4j?: { uri: string; user: string; password: string };
  cache?: { ttl: number; maxSize: number };
  compression?: boolean;
}

class UnifiedMemory extends EventEmitter {
  private config: UnifiedMemoryConfig;
  private stores: Map<string, unknown>;
  private cache: Map<string, CacheEntry>;
  private initialized: boolean;

  constructor(config: UnifiedMemoryConfig = {}) {
    // ...
  }
}
```

---

## 📋 Implementation Checklist

- [ ] Install zod: `npm install zod`
- [ ] Update ID generation in unified-api.ts
- [ ] Update ID generation in vector-store.ts
- [ ] Update ID generation in orchestrator.ts
- [ ] Update ID generation in ai-meta-layer.ts
- [ ] Add input validation to ai-meta-layer.ts
- [ ] Batch SQL operations in unified-api.ts
- [ ] Add try/finally for rate limiter lease release
- [ ] Add proper TypeScript types
- [ ] Run tests to verify fixes
- [ ] Run typecheck: `npm run typecheck`

---

## 🔧 Test Commands

```bash
# After applying fixes
npm run typecheck       # Should show reduced errors
npm test                # All 489 tests should still pass
npm run lint            # Check for lint errors
```
