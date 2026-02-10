#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const script = path.join(__dirname, 'add-jsdoc.cjs');

const child = spawn(process.execPath, [script], { stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

/**
 * Error handler for add-jsdoc
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[add-jsdoc]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
