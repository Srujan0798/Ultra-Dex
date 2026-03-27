# TASK 5: Schema Versioning System

**Assigned to:** Codex  
**Priority:** Wave 2 — HIGH  
**Estimated time:** 20–30 minutes

---

## Objective

Add version fields to all persistence formats and build a migration pipeline so data format upgrades don't cause silent data loss.

## Problem

Neither `memory.json`, `ledger.jsonl`, nor the SQLite database have a version field. If data structures change between versions, existing data silently triggers the "wipe-on-error" behavior.

## Implementation Plan

### Step 1: Create SchemaMigrator

Create `src/core/utils/schema-migrator.js`:

```javascript
export class SchemaMigrator {
  constructor() {
    this.migrations = new Map(); // version -> transform function
  }

  register(fromVersion, toVersion, transformFn) {
    this.migrations.set(`${fromVersion}->${toVersion}`, transformFn);
  }

  migrate(data, fromVersion, targetVersion) {
    let current = fromVersion;
    let result = data;
    
    while (current < targetVersion) {
      const next = current + 1;
      const key = `${current}->${next}`;
      const transform = this.migrations.get(key);
      
      if (!transform) {
        throw new Error(`No migration path from v${current} to v${next}`);
      }
      
      result = transform(result);
      current = next;
    }
    
    return result;
  }
}
```

### Step 2: Version all JSON stores

**memory.json format:**
```json
{
  "_version": 1,
  "_migratedAt": "2026-03-27T00:00:00Z",
  "entries": [...]
}
```

**ledger.jsonl format:** Each line gets `"_v": 1`

### Step 3: Version SQLite

Add `schema_version` table:
```sql
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);
```

Check version on startup. If version < current, run migrations.

### Step 4: Register initial migrations

```javascript
// v0 (no version field) -> v1 (has version field)
migrator.register(0, 1, (data) => {
  if (Array.isArray(data)) {
    return { _version: 1, entries: data };
  }
  return { _version: 1, ...data };
});
```

## Target Files

- `src/core/utils/schema-migrator.js` [NEW]
- `apps/cli/lib/ledger/storage.js` [MODIFY — add version]
- `apps/cli/lib/mcp/memory.js` [MODIFY — add version]
- `apps/cli/lib/utils/sessionPersistence.js` [MODIFY — add schema_version table]

## Validation Criteria

1. Create a v0 format file (just `[]`). Load it. Must auto-migrate to v1 format: `{ _version: 1, entries: [] }`
2. Save data. Verify `_version` field present in saved file.
3. Create v1 SQLite. Verify `schema_version` table exists with version=1.
