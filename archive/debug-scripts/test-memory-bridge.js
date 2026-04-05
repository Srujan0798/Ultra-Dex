import { MemoryBridge } from './apps/cli/lib/autonomous/memory-bridge.js';
import path from 'path';
import fs from 'fs/promises';

async function run() {
  const tmpDir = path.join(process.cwd(), '.tmp-test-memory');
  await fs.mkdir(tmpDir, { recursive: true });
  
  const bridge = new MemoryBridge({ dataDir: tmpDir });
  console.log('Bridge created');
  
  await bridge.saveContext({
    sessionId: 'test-session',
    goal: 'test goal'
  });
  console.log('Context saved');
  
  const context = await bridge.loadContext('test-session');
  console.log('Context loaded:', !!context);
  
  await fs.rm(tmpDir, { recursive: true, force: true });
  console.log('Cleanup done');
}

run().catch(console.error);
