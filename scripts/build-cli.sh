#!/bin/bash
set -e

mkdir -p dist

cat > dist/ultra-dex.js << 'WRAPPER_EOF'
#!/usr/bin/env node
/**
 * Ultra-Dex CLI Entry Point
 * Uses tsx loader to handle TypeScript imports from src/core
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const actualCli = path.resolve(projectRoot, 'apps/cli/bin/ultra-dex.js');

// Run with tsx loader
const tsxPath = path.resolve(projectRoot, 'node_modules/.bin/tsx');
const args = [actualCli, ...process.argv.slice(2)];

const child = spawn(tsxPath, args, {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start CLI:', err.message);
  process.exit(1);
});
WRAPPER_EOF

chmod +x dist/ultra-dex.js
echo 'CLI built: dist/ultra-dex.js'
