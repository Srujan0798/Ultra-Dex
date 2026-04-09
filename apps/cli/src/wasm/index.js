/**
 * @fileoverview Index module
 * @module wasm/index
 */

import path from 'path';
import WasmRuntime from './runtime.js';

export function createWasmRuntime(options = {}) {
  return new WasmRuntime(options);
}

export async function runWasmModule(
  modulePath,
  { capabilities = {}, exportName = 'main', args = [], baseDir = process.cwd() } = {}
) {
  const runtime = createWasmRuntime({ baseDir });
  const loaded = await runtime.loadModule(modulePath, capabilities);
  const target = loaded.exports[exportName];

  if (typeof target !== 'function') {
    throw new Error(
      `Export "${exportName}" not found in module: ${path.resolve(baseDir, modulePath)}`
    );
  }

  return target(...args);
}

export default {
  createWasmRuntime,
  runWasmModule,
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    process.stderr.write(`[index] ${error instanceof Error ? error.message : String(error)}\n`);
  } catch (_) {
    // Fail silently
  }
}
