import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function withTempCwd(fn) {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-persist-'));

  process.chdir(tempDir);

  try {
    await fn(tempDir);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function importLedgerStorage() {
  const moduleUrl = new URL(`../../apps/cli/lib/ledger/storage.js?test=${Date.now()}${Math.random()}`, import.meta.url);
  return import(moduleUrl.href);
}

describe('Persistence corruption handling', () => {
  test('ledger recovers from backup instead of silently wiping corrupted JSONL', async () => {
    await withTempCwd(async () => {
      const { appendEntry, readLedger, ledgerPath } = await importLedgerStorage();

      await appendEntry({
        id: 'entry-1',
        agent: 'alpha',
        action: 'decision',
        input: 'first',
        output: 'first-output',
      });

      await appendEntry({
        id: 'entry-2',
        agent: 'beta',
        action: 'decision',
        input: 'second',
        output: 'second-output',
      });

      const backupPath = `${ledgerPath}.bak`;
      const backupBeforeCorruption = await fs.readFile(backupPath, 'utf8');

      await fs.writeFile(ledgerPath, '{"id":"partial-write"');

      const recoveredEntries = await readLedger();
      const restoredLedger = await fs.readFile(ledgerPath, 'utf8');

      assert.strictEqual(recoveredEntries.length, 1);
      assert.strictEqual(recoveredEntries[0].id, 'entry-1');
      assert.strictEqual(restoredLedger, backupBeforeCorruption);
    });
  });

  test('ledger throws CorruptionError when no backup can be recovered', async () => {
    await withTempCwd(async () => {
      const { readLedger, ledgerPath } = await importLedgerStorage();

      await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
      await fs.writeFile(ledgerPath, '{"id":"partial-write"');

      await assert.rejects(
        () => readLedger(),
        (error) => error?.name === 'CorruptionError' && /No valid backup could be recovered/.test(error.message)
      );
    });
  });
});
