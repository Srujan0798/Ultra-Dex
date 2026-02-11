/**
 * @fileoverview Install Completion module
 * @module scripts/install-completion
 */

#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex

import { installCompletion } from '../lib/commands/install-completion.js';

async function main() {
  const args = process.argv.slice(2);
  const shellFlag = args.find((arg) => arg.startsWith('--shell='));
  const shell = shellFlag ? shellFlag.split('=')[1] : undefined;

  await installCompletion({ shell });
}

main().catch((error) => {
  console.error(`Failed to install completion: ${error.message}`);
  process.exit(1);
});
