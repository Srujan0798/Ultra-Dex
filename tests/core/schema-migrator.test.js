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
  test('migrates v0 ledger JSONL records to v1 without data loss', async () => {
    await withTempCwd(async () => {
      const ledgerModule = await importFresh('../../apps/cli/lib/ledger/storage.js');
      const { computeChecksum, readLedger, ledgerPath } = ledgerModule;

      const v0Entry = {
        id: 'ledger-v0',
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
        metadata: { source: 'v0' },
      };
      v0Entry.checksum = computeChecksum(v0Entry);

      await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
      await fs.writeFile(ledgerPath, `${JSON.stringify(v0Entry)}\n`);

      const entries = await readLedger();
      const migratedContent = await fs.readFile(ledgerPath, 'utf8');
      const migratedEntry = JSON.parse(migratedContent.trim());

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].id, 'ledger-v0');
      assert.strictEqual(entries[0].metadata.source, 'v0');
      assert.strictEqual(entries[0]._v, 1);
      assert.strictEqual(migratedEntry._v, 1);
      assert.strictEqual(migratedEntry.rationale, 'keep all fields');
    });
  });

  test('migrates v0 memory JSON payload to v1 and persists versioned structure', async () => {
    await withTempCwd(async () => {
      const { UltraMemory } = await importFresh('../../apps/cli/lib/mcp/memory.js');
      const memoryPath = path.resolve(process.cwd(), '.ultra', 'memory.json');

      await fs.mkdir(path.dirname(memoryPath), { recursive: true });
      await fs.writeFile(memoryPath, '[]');

      const memory = new UltraMemory();
      await memory.init();

      const migratedPayload = JSON.parse(await fs.readFile(memoryPath, 'utf8'));

      assert.strictEqual(migratedPayload._version, 1);
      assert.ok(typeof migratedPayload._migratedAt === 'string');
      assert.deepStrictEqual(migratedPayload.entries, []);

      await memory.remember('remember this', ['tagged'], 'legacy', { origin: 'v0' });
      const savedPayload = JSON.parse(await fs.readFile(memoryPath, 'utf8'));

      assert.strictEqual(savedPayload._version, 1);
      assert.strictEqual(savedPayload.entries.length, 1);
      assert.strictEqual(savedPayload.entries[0].text, 'remember this');
    });
  });

  test('sessionPersistence init ensures sqlite schema_version starts at v1', async () => {
    const { createSessionPersistence } = await importFresh(
      '../../apps/cli/lib/utils/sessionPersistence.js'
    );
    const persistence = createSessionPersistence('/tmp/ultra-dex-schema-version-test');
    const state = {
      execCalls: [],
      runCalls: [],
    };

    persistence.openDatabase = async () => ({
      async exec(sql) {
        state.execCalls.push(sql);
      },
      async run(sql, params = []) {
        state.runCalls.push({ sql, params });
      },
      async get(sql) {
        if (sql.includes('SELECT version FROM schema_version')) {
          return { version: 1 };
        }
        return null;
      },
    });

    await persistence.init();

    assert.ok(
      state.execCalls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS schema_version'))
    );
    assert.ok(
      state.runCalls.some(
        ({ sql }) =>
          sql.includes('INSERT OR IGNORE INTO schema_version') && sql.includes('VALUES (1, 1)')
      )
    );
  });
});
