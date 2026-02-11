// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

async function breakSystem() {
  console.log('破坏 (Breaking system for Chaos Test)...');
  const filePath = path.resolve('cli/lib/utils/files.js');
  const content = await fs.readFile(filePath, 'utf8');

  // Introduce a syntax error by appending garbage
  const brokenContent =
    content + '\n\nexport const chaos = { error: true };\nconsole.log(undefined.nothing);';

  await fs.writeFile(filePath, brokenContent);
  console.log('❌ System is now broken.');
}

breakSystem();

/**
 * Error handler for chaos-trigger
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[chaos-trigger]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
