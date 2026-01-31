#!/usr/bin/env node
/**
 * Test runner for Ultra-Dex CLI
 * Runs all tests from the CLI directory
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(__dirname);  // cli directory is where this file is

console.log('🧪 Running Ultra-Dex CLI Tests...\n');
console.log(`📁 CLI directory: ${cliDir}\n`);

const testFiles = [
  'cli/test/commands.test.js',
  'cli/test/critical-commands.test.js',
  'cli/test/mcp.test.js',
  'cli/test/cli.test.js',
  'cli/test/delegation.test.js',
  'cli/test/v2-commands.test.js'
];

const args = ['--test', ...testFiles];

const child = spawn('node', args, {
  cwd: path.resolve(__dirname, '..'),  // Run from root where cli/ is
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '3' }
});

child.on('exit', (code) => {
  process.exit(code);
});
