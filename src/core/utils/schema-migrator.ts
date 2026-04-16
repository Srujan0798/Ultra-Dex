var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (
  decorators: Function[],
  target: object,
  key: PropertyKey = '',
  kind: number = 0
) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (
        kind
          ? (decorator as (value: object, propertyKey: PropertyKey, descriptor?: unknown) => unknown)(
              target,
              key,
              result
            )
          : (decorator as (value: object) => unknown)(result as object)
      ) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';

interface MigrationContext extends Record<string, unknown> {
  fromVersion: number;
  toVersion: number;
  recomputeChecksum?: (entry: Record<string, unknown>) => unknown;
}

type MigrationTransform = (data: unknown, context: MigrationContext) => unknown;

interface SchemaVersionRow {
  version: number;
}

interface SqliteLikeDatabase {
  exec(sql: string): Promise<unknown>;
  run(sql: string): Promise<unknown>;
  get(sql: string): Promise<SchemaVersionRow>;
}

const CURRENT_SCHEMA_VERSION = 1;
let SchemaMigrator = class {
  migrations: Map<string, MigrationTransform>;

  constructor() {
    this.migrations = /* @__PURE__ */ new Map<string, MigrationTransform>();
  }
  register(fromVersion: number, toVersion: number, transformFn: MigrationTransform): this {
    this.migrations.set(`${fromVersion}->${toVersion}`, transformFn);
    return this;
  }
  migrate(
    data: unknown,
    fromVersion: number,
    targetVersion: number = CURRENT_SCHEMA_VERSION,
    context: Record<string, unknown> = {}
  ): unknown {
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
};
SchemaMigrator = __decorateClass([singleton()], SchemaMigrator) as typeof SchemaMigrator;
const memoryMigrator = new SchemaMigrator().register(0, 1, (data: unknown) => ({
  _version: 1,
  _migratedAt: /* @__PURE__ */ new Date().toISOString(),
  entries:
    Array.isArray(data) || !data || typeof data !== 'object'
      ? Array.isArray(data)
        ? data
        : []
      : ((data as { entries?: unknown[] }).entries ?? []),
}));
const ledgerMigrator = new SchemaMigrator().register(0, 1, (data: unknown, context) =>
  (Array.isArray(data) ? data : []).map((entry: unknown) => {
    const migrated: Record<string, unknown> & { _v: number } = {
      ...(typeof entry === 'object' && entry ? (entry as Record<string, unknown>) : {}),
      _v: 1,
    };
    if (typeof context.recomputeChecksum === 'function') {
      migrated.checksum = context.recomputeChecksum(migrated);
    }
    return migrated;
  })
);
function detectMemoryVersion(data: unknown): number {
  if (Array.isArray(data)) {
    return 0;
  }
  return typeof data === 'object' && data && '_version' in data
    ? ((data as { _version?: number })._version ?? 0)
    : 0;
}
function detectLedgerVersion(entries: unknown): number {
  if (!Array.isArray(entries) || entries.length === 0) {
    return CURRENT_SCHEMA_VERSION;
  }
  return entries.every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      '_v' in entry &&
      typeof (entry as { _v?: unknown })._v === 'number'
  )
    ? CURRENT_SCHEMA_VERSION
    : 0;
}
async function ensureSqliteSchemaVersion(db: SqliteLikeDatabase): Promise<SchemaVersionRow> {
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
export {
  CURRENT_SCHEMA_VERSION,
  SchemaMigrator,
  detectLedgerVersion,
  detectMemoryVersion,
  ensureSqliteSchemaVersion,
  ledgerMigrator,
  memoryMigrator,
};
