import fs from 'fs/promises';
import path from 'path';
import { appendEntry, readLedger, ledgerPath } from './cli/lib/ledger/storage.js';

// Setup
const TEST_LEDGER_PATH = path.resolve(process.cwd(), '.ultra/ledger.jsonl');

async function run() {
  console.log('--- Ledger Corruption Reproduction ---');

  // 1. Clean slate
  try {
    await fs.unlink(TEST_LEDGER_PATH);
  } catch (e) {}

  // 2. Add valid entries
  console.log('Adding valid entries...');
  await appendEntry({ decision: 'Valid 1' });
  await appendEntry({ decision: 'Valid 2' });

  // 3. Verify valid
  let entries = await readLedger();
  console.log(`Entries after valid writes: ${entries.length}`);
  if (entries.length !== 2) {
      console.error('FAIL: Expected 2 entries.');
      process.exit(1);
  }

  // 4. Corrupt the file
  console.log('Corrupting ledger file with one invalid line...');
  await fs.appendFile(TEST_LEDGER_PATH, 'This is not JSON\n');

  // 5. Read again
  console.log('Reading ledger after corruption...');
  entries = await readLedger();
  console.log(`Entries after corruption: ${entries.length}`);

  if (entries.length === 0) {
      console.log('SUCCESS: Reproduced data loss. readLedger() returned 0 entries despite 2 valid ones existing.');
  } else {
      console.log(`FAIL: readLedger() returned ${entries.length} entries. Vulnerability not reproduced.`);
  }
}

run().catch(console.error);
