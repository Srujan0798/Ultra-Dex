// Copyright (c) 2026 Ultra-Dex

export const CURRENT_SCHEMA_VERSION = 2;

export class SchemaMigrator {
  constructor() {
    this.pipelines = new Map();
    this.sqlitePipelines = new Map();
  }

  registerPipeline(name, config) {
    this.pipelines.set(name, config);
    return this;
  }

  registerSqlitePipeline(name, config) {
    this.sqlitePipelines.set(name, config);
    return this;
  }

  migrate(name, payload, context = {}) {
    const pipeline = this.pipelines.get(name);
    if (!pipeline) {
      throw new Error(`Unknown schema pipeline: ${name}`);
    }

    const latestVersion = pipeline.latestVersion ?? CURRENT_SCHEMA_VERSION;
    let version = pipeline.detectVersion(payload, context);
    let current = payload;
    let migrated = false;

    while (version < latestVersion) {
      const nextVersion = version + 1;
      const migration = pipeline.migrations?.[nextVersion];
      if (typeof migration !== 'function') {
        throw new Error(`Missing migration for ${name} v${version} -> v${nextVersion}`);
      }

      current = migration(current, { ...context, fromVersion: version, toVersion: nextVersion });
      version = nextVersion;
      migrated = true;
    }

    current = pipeline.finalize ? pipeline.finalize(current, { ...context, version }) : current;

    return {
      version,
      migrated,
      data: current,
    };
  }

  async migrateSqlite(name, db, context = {}) {
    const pipeline = this.sqlitePipelines.get(name);
    if (!pipeline) {
      throw new Error(`Unknown SQLite schema pipeline: ${name}`);
    }

    const latestVersion = pipeline.latestVersion ?? CURRENT_SCHEMA_VERSION;
    let version = await pipeline.detectVersion(db, context);
    let migrated = false;

    while (version < latestVersion) {
      const nextVersion = version + 1;
      const migration = pipeline.migrations?.[nextVersion];
      if (typeof migration !== 'function') {
        throw new Error(`Missing SQLite migration for ${name} v${version} -> v${nextVersion}`);
      }

      await migration(db, { ...context, fromVersion: version, toVersion: nextVersion });
      version = nextVersion;
      migrated = true;
    }

    return { version, migrated };
  }
}

export const schemaMigrator = new SchemaMigrator()
  .registerPipeline('memory', {
    latestVersion: CURRENT_SCHEMA_VERSION,
    detectVersion(payload) {
      if (Array.isArray(payload)) {
        return 1;
      }
      return payload?._version ?? 1;
    },
    migrations: {
      2(payload) {
        const entries = Array.isArray(payload) ? payload : payload?.entries || [];
        return {
          _version: 2,
          entries,
        };
      },
    },
    finalize(payload) {
      return {
        _version: payload?._version ?? CURRENT_SCHEMA_VERSION,
        entries: Array.isArray(payload?.entries) ? payload.entries : [],
      };
    },
  })
  .registerPipeline('ledger', {
    latestVersion: CURRENT_SCHEMA_VERSION,
    detectVersion(payload) {
      if (!Array.isArray(payload) || payload.length === 0) {
        return CURRENT_SCHEMA_VERSION;
      }
      return payload.every((entry) => entry && typeof entry._version === 'number') ? CURRENT_SCHEMA_VERSION : 1;
    },
    migrations: {
      2(payload, context) {
        return (Array.isArray(payload) ? payload : []).map((entry) => {
          const migratedEntry = {
            ...entry,
            _version: 2,
          };
          if (typeof context.recomputeChecksum === 'function') {
            migratedEntry.checksum = context.recomputeChecksum(migratedEntry);
          }
          return migratedEntry;
        });
      },
    },
    finalize(payload) {
      return Array.isArray(payload) ? payload : [];
    },
  })
  .registerSqlitePipeline('session-persistence', {
    latestVersion: CURRENT_SCHEMA_VERSION,
    async detectVersion(db) {
      const table = await db.get(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'"
      );
      if (!table) {
        return 1;
      }

      const row = await db.get(
        'SELECT version FROM schema_version WHERE schema_name = ?',
        ['session-persistence']
      );
      return row?.version ?? 1;
    },
    migrations: {
      async 2(db) {
        await db.exec(`
          CREATE TABLE IF NOT EXISTS schema_version (
            schema_name TEXT PRIMARY KEY,
            version INTEGER NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await db.run(
          `INSERT INTO schema_version (schema_name, version, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(schema_name) DO UPDATE SET
             version = excluded.version,
             updated_at = CURRENT_TIMESTAMP`,
          ['session-persistence', 2]
        );
      },
    },
  });

export default schemaMigrator;
