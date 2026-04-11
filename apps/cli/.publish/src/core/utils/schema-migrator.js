// Copyright (c) 2026 Ultra-Dex

export const CURRENT_SCHEMA_VERSION = 1;

export class SchemaMigrator {
  constructor() {
    this.migrations = new Map();
  }

  register(fromVersion, toVersion, transformFn) {
    this.migrations.set(`${fromVersion}->${toVersion}`, transformFn);
    return this;
  }

  migrate(data, fromVersion, targetVersion = CURRENT_SCHEMA_VERSION, context = {}) {
    let current = fromVersion;
    let result = data;

    while (current < targetVersion) {
      const next = current + 1;
      const transform = this.migrations.get(`${current}->${next}`);

      if (typeof transform !== 'function') {
        throw new Error(`No migration path from v${current} to v${next}`);
      }

      result = transform(result, { ...context, fromVersion: current, toVersion: next });
      current = next;
    }

    return result;
  }
}

export const memoryMigrator = new SchemaMigrator().register(0, 1, (data) => ({
  _version: 1,
  _migratedAt: new Date().toISOString(),
  entries: Array.isArray(data) ? data : data?.entries || [],
}));

export const ledgerMigrator = new SchemaMigrator().register(0, 1, (data, context) =>
  (Array.isArray(data) ? data : []).map((entry) => {
    const migrated = { ...entry, _v: 1 };
    if (typeof context.recomputeChecksum === 'function') {
      migrated.checksum = context.recomputeChecksum(migrated);
    }
    return migrated;
  })
);

export function detectMemoryVersion(data) {
  if (Array.isArray(data)) {
    return 0;
  }
  return data?._version ?? 0;
}

export function detectLedgerVersion(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return CURRENT_SCHEMA_VERSION;
  }

  return entries.every((entry) => entry && typeof entry._v === 'number')
    ? CURRENT_SCHEMA_VERSION
    : 0;
}

export async function ensureSqliteSchemaVersion(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.run('INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1)');
  return db.get('SELECT version FROM schema_version WHERE id = 1');
}
