// Copyright (c) 2026 Ultra-Dex

import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function withTempCwd(fn) {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-atomic-'));
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

describe('Atomic writes and corruption recovery', () => {
  test('ledger partially recovers JSONL when one line is corrupted', async () => {
    await withTempCwd(async () => {
      const { readLedger, ledgerPath } = await importFresh('../../apps/cli/lib/ledger/storage.js');
      const lines = Array.from({ length: 100 }, (_, index) =>
        JSON.stringify({
          _v: 1,
          id: `entry-${index}`,
          agent: 'tester',
          action: 'decision',
          input: `input-${index}`,
          output: `output-${index}`,
          timestamp: new Date().toISOString(),
          checksum: `checksum-${index}`,
        })
      );

      lines[50] = '{"id":"broken"';
      await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
      await fs.writeFile(ledgerPath, `${lines.join('\n')}\n`);

      const recovered = await readLedger();

      assert.strictEqual(recovered.length, 99);
      assert.strictEqual(recovered.some((entry) => entry.id === 'entry-49'), true);
      assert.strictEqual(recovered.some((entry) => entry.id === 'entry-51'), true);
    });
  });

  test('memory recovers from backup instead of returning empty state on corruption', async () => {
    await withTempCwd(async () => {
      const { UltraMemory } = await importFresh('../../apps/cli/lib/mcp/memory.js');
      const memoryPath = path.resolve(process.cwd(), '.ultra', 'memory.json');
      const backupPayload = {
        _version: 1,
        _migratedAt: new Date().toISOString(),
        entries: [{ id: 'backup-entry', text: 'restored from backup', tags: [], source: 'test' }],
      };

      await fs.mkdir(path.dirname(memoryPath), { recursive: true });
      await fs.writeFile(memoryPath, '{"_version":1,"entries":');
      await fs.writeFile(`${memoryPath}.bak`, JSON.stringify(backupPayload, null, 2));

      const memory = new UltraMemory();
      await memory.init();

      assert.strictEqual(memory.memory.length, 1);
      assert.strictEqual(memory.memory[0].id, 'backup-entry');
    });
  });

  test('memory throws CorruptionError when corruption cannot be recovered', async () => {
    await withTempCwd(async () => {
      const { UltraMemory } = await importFresh('../../apps/cli/lib/mcp/memory.js');
      const memoryPath = path.resolve(process.cwd(), '.ultra', 'memory.json');

      await fs.mkdir(path.dirname(memoryPath), { recursive: true });
      await fs.writeFile(memoryPath, '{"_version":1,"entries":');

      const memory = new UltraMemory();

      await assert.rejects(
        () => memory.init(),
        (error) => error?.name === 'CorruptionError' && /Data corruption detected/.test(error.message)
      );
    });
  });

  test('sessionPersistence wraps decision saves in a transaction and rolls back on failure', async () => {
    const { createSessionPersistence } = await importFresh('../../apps/cli/lib/utils/sessionPersistence.js');
    const persistence = createSessionPersistence('/tmp/ultra-dex-atomic-session-test');
    const transactionLog = [];
    let memoryIndexWrites = 0;

    persistence.init = async () => {
      persistence.db = {
        async exec(sql) {
          transactionLog.push(sql);
        },
        async run(sql) {
          if (sql.includes('INSERT INTO memory_index')) {
            memoryIndexWrites += 1;
            if (memoryIndexWrites === 1) {
              throw new Error('keyword insert failed');
            }
          }
        },
      };
    };

    await assert.rejects(
      () => persistence.saveDecision('session-1', 'agent-1', 'task', 'decision', { ok: true }),
      /keyword insert failed/
    );

    assert.deepStrictEqual(transactionLog, ['BEGIN TRANSACTION', 'ROLLBACK']);
  });
});
