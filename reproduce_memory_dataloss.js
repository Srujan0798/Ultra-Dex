import fs from 'fs/promises';
import path from 'path';
import { UltraMemory } from './cli/lib/mcp/memory.js';

const MEMORY_PATH = path.resolve(process.cwd(), '.ultra/memory.json');

async function run() {
  console.log('--- Memory Data Loss Reproduction ---');

  // 1. Clean slate
  try {
    await fs.unlink(MEMORY_PATH);
    await fs.rm(path.dirname(MEMORY_PATH), { recursive: true, force: true });
  } catch (e) {}

  // 2. Init and add memory
  console.log('Initializing memory and adding data...');
  const mem1 = new UltraMemory();
  await mem1.init();
  await mem1.remember('This is important data');
  await mem1.remember('Do not lose this');

  // Check file exists
  const content = await fs.readFile(MEMORY_PATH, 'utf8');
  console.log(`Memory file content length: ${content.length}`);

  // 3. Corrupt the file
  console.log('Corrupting memory file (invalid JSON)...');
  await fs.writeFile(MEMORY_PATH, '{ "this": "is", "broken": JSON '); // Missing closing brace

  // 4. Re-init memory (simulate restart)
  console.log('Re-initializing memory (simulating restart)...');
  const mem2 = new UltraMemory();
  await mem2.init();

  const entries = await mem2.getAll();
  console.log(`Memory entries after corruption: ${entries.length}`);

  if (entries.length === 0) {
      console.log('SUCCESS: Reproduced data loss. Memory reset to empty on corruption.');
  } else {
      console.log(`FAIL: Memory preserved ${entries.length} entries.`);
  }
}

run().catch(console.error);
