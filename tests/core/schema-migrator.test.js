// Copyright (c) 2026 Ultra-Dex

import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function withTempCwd(fn) {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-schema-'));
  process.chdir(tempDir);

  try {
    await fn(tempDir);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function importFresh(relativePath) {
  const moduleUrl = new URL(`${relativePath}?test=${Date.now()}${Math.random()}`, import.meta.url);
  return import(moduleUrl.href);
}

describe('Schema migrator', () => {
  test('migrates v1 ledger JSONL records to v2 without data loss', async () => {
    await withTempCwd(async () => {
      const ledgerModule = await importFresh('../../apps/cli/lib/ledger/storage.js');
      const { computeChecksum, readLedger, ledgerPath } = ledgerModule;

      const v1Entry = {
        id: 'ledger-v1',
        block_id: 'block-1',
        task_id: 'task-1',
        timestamp: '2026-03-27T00:00:00.000Z',
        agent: 'planner',
        action: 'decision',
        input: 'old-input',
        output: 'old-output',
        rationale: 'keep all fields',
        decision: 'ship it',
        constraints_checked: ['schema'],
        artifacts: ['artifact.txt'],
        affected_files: ['a.js'],
        metadata: { source: 'v1' },
      };
      v1Entry.checksum = computeChecksum(v1Entry);

      await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
      await fs.writeFile(ledgerPath, `${JSON.stringify(v1Entry)}\n`);

      const entries = await readLedger();
      const migratedContent = await fs.readFile(ledgerPath, 'utf8');
      const migratedEntry = JSON.parse(migratedContent.trim());

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].id, 'ledger-v1');
      assert.strictEqual(entries[0].metadata.source, 'v1');
      assert.strictEqual(entries[0]._version, 2);
      assert.strictEqual(migratedEntry._version, 2);
      assert.strictEqual(migratedEntry.rationale, 'keep all fields');
    });
  });

  test('migrates v1 memory JSON payload to v2 without data loss', async () => {
    const { schemaMigrator } = await importFresh('../../src/core/utils/schema-migrator.js');
    const v1Memory = [
      {
        id: 'mem-v1',
        text: 'remember this',
        tags: ['tagged'],
        source: 'legacy',
        timestamp: '2026-03-27T00:00:00.000Z',
        metadata: { origin: 'v1' },
      },
    ];

    const migration = schemaMigrator.migrate('memory', v1Memory);

    assert.strictEqual(migration.version, 2);
    assert.strictEqual(migration.migrated, true);
    assert.strictEqual(migration.data._version, 2);
    assert.strictEqual(migration.data.entries.length, 1);
    assert.strictEqual(migration.data.entries[0].id, 'mem-v1');
    assert.strictEqual(migration.data.entries[0].metadata.origin, 'v1');
  });

  test('creates and updates sqlite schema_version for session persistence', async () => {
    const { schemaMigrator } = await importFresh('../../src/core/utils/schema-migrator.js');
    const state = {
      hasSchemaVersionTable: false,
      rows: new Map(),
    };
    const db = {
      async get(query, params = []) {
        if (query.includes("sqlite_master")) {
          return state.hasSchemaVersionTable ? { name: 'schema_version' } : undefined;
        }
        if (query.includes('SELECT version FROM schema_version')) {
          const version = state.rows.get(params[0]);
          return version ? { version } : undefined;
        }
        return undefined;
      },
      async exec(query) {
        if (query.includes('CREATE TABLE IF NOT EXISTS schema_version')) {
          state.hasSchemaVersionTable = true;
        }
      },
      async run(_query, params = []) {
        state.rows.set(params[0], params[1]);
      },
    };

    const migration = await schemaMigrator.migrateSqlite('session-persistence', db);

    assert.strictEqual(migration.version, 2);
    assert.strictEqual(migration.migrated, true);
    assert.strictEqual(state.hasSchemaVersionTable, true);
    assert.strictEqual(state.rows.get('session-persistence'), 2);
  });
});
