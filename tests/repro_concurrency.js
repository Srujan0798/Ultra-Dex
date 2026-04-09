import { ultraMemory } from '../apps/cli/lib/mcp/memory.js';
import fs from 'fs/promises';
import path from 'path';

async function run() {
  console.log('Running Memory Concurrency Reproduction Test...');

  // Clean up any existing memory file to start fresh
  const memoryPath = path.resolve(process.cwd(), '.ultra', 'memory.json');
  try {
    await fs.rm(memoryPath, { force: true });
  } catch (e) {}

  // Re-init explicitly
  ultraMemory.initialized = false;
  ultraMemory.memory = [];
  await ultraMemory.init();

  const key1 = 'Concurrency Test 1';
  const key2 = 'Concurrency Test 2';

  console.log(`Triggering parallel writes for "${key1}" and "${key2}"...`);

  // Launch two remember calls without awaiting the first one
  // We add a small delay to the first one's internal saveToFile to ensure overlap if possible,
  // but we can't easily modify the code.
  // However, fs.writeFile is async, so if we fire two requests fast enough, the second one should hit isSaving=true.

  const p1 = ultraMemory.remember(key1);
  const p2 = ultraMemory.remember(key2);

  await Promise.all([p1, p2]);

  console.log('Writes completed (promises resolved). Checking persistence...');

  // Read the file directly to see what was persisted
  const content = await fs.readFile(memoryPath, 'utf8');
  const data = JSON.parse(content);

  const hasKey1 = data.some((item) => item.text === key1);
  const hasKey2 = data.some((item) => item.text === key2);

  console.log(`File contains "${key1}": ${hasKey1}`);
  console.log(`File contains "${key2}": ${hasKey2}`);

  if (!hasKey1 || !hasKey2) {
    console.log('SUCCESS: Race condition reproduced. One or both entries are missing from disk.');
  } else {
    console.log(
      'FAILURE: Both entries were persisted correctly. The race might not have occurred naturally.'
    );
  }
}

run().catch(console.error);
