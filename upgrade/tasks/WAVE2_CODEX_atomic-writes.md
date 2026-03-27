# TASK 4: Atomic Writes for Ledger & Memory

**Assigned to:** Codex  
**Priority:** Wave 2 — CRITICAL  
**Estimated time:** 30–45 minutes

---

## Objective

Implement write-to-temp-then-rename pattern for all JSON/JSONL persistence stores to prevent data loss on crash. Eliminate all "return empty on corruption" behavior.

## Problem

1. `apps/cli/lib/ledger/storage.js` — `readLedger()` catches JSON parse errors and returns `[]`. One corrupted line = 100% data loss from app perspective.
2. `apps/cli/lib/mcp/memory.js` — `UltraMemory.init()` catches parse error and resets to `[]`, then overwrites the (potentially recoverable) corrupt file.
3. `apps/cli/lib/utils/sessionPersistence.js` — Multi-step DB inserts without transactions.

## Implementation Plan

### Step 1: Create safe-fs utility

Create `src/core/utils/safe-fs.js`:

```javascript
import { writeFileSync, renameSync, existsSync, copyFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

export function atomicWriteSync(filePath, data) {
  const tmpPath = filePath + '.tmp';
  const backupPath = filePath + '.bak';
  
  // Write to temp
  writeFileSync(tmpPath, data, 'utf8');
  
  // Backup existing if present
  if (existsSync(filePath)) {
    copyFileSync(filePath, backupPath);
  }
  
  // Atomic rename
  renameSync(tmpPath, filePath);
}

export function safeReadJSON(filePath) {
  try {
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (parseError) {
    // Try backup
    const backupPath = filePath + '.bak';
    if (existsSync(backupPath)) {
      try {
        const backup = readFileSync(backupPath, 'utf8');
        return JSON.parse(backup);
      } catch { /* fall through */ }
    }
    // DO NOT return []. Throw with recovery info.
    throw new DataCorruptionError(filePath, parseError);
  }
}

export class DataCorruptionError extends Error {
  constructor(filePath, cause) {
    super(`Data corruption detected in ${filePath}. Backup attempted. Manual recovery may be needed.`);
    this.filePath = filePath;
    this.cause = cause;
    this.name = 'DataCorruptionError';
  }
}
```

### Step 2: Refactor Ledger storage

In `apps/cli/lib/ledger/storage.js`:
- Replace `fs.writeFileSync` with `atomicWriteSync`
- Replace `readLedger` catch block: instead of returning `[]`, use `safeReadJSON` with backup recovery
- For JSONL: parse line-by-line, skip corrupt lines but log warnings (partial recovery instead of total wipe)

### Step 3: Refactor UltraMemory

In `apps/cli/lib/mcp/memory.js`:
- Replace `this.memory = []` in catch block with `safeReadJSON` recovery logic
- Use `atomicWriteSync` for all saves

### Step 4: Add transactions to sessionPersistence

In `apps/cli/lib/utils/sessionPersistence.js`:
- Wrap `saveDecision` multi-step inserts in `db.exec('BEGIN TRANSACTION')` / `db.exec('COMMIT')`
- Add `db.exec('ROLLBACK')` in catch block

## Target Files

- `src/core/utils/safe-fs.js` [NEW]
- `apps/cli/lib/ledger/storage.js` [MODIFY]
- `apps/cli/lib/mcp/memory.js` [MODIFY]
- `apps/cli/lib/utils/sessionPersistence.js` [MODIFY]

## Validation Criteria

1. Write valid data. Corrupt the file manually. Read must detect corruption and attempt backup recovery.
2. Never return `[]` on corruption — must throw `DataCorruptionError`
3. For JSONL: corrupt ONE line in a 100-line file. Must recover 99 lines, not 0.
4. SessionPersistence: kill process mid-write. Database must not have partial records.
