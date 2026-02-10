/**
 * @fileoverview Runtime module
 * @module wasm/runtime
 */

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CAPABILITIES = Object.freeze({
  filesystem: false,
  network: false,
  env: false,
});

function normalizeCapabilities(capabilities = {}) {
  return {
    ...DEFAULT_CAPABILITIES,
    ...capabilities,
  };
}

function assertWasmFile(filePath) {
  if (!filePath || path.extname(filePath) !== '.wasm') {
    throw new Error('A valid .wasm module path is required');
  }
}

export class WasmRuntime {
  constructor(options = {}) {
    this.baseDir = options.baseDir || process.cwd();
  }

  async loadModule(filePath, capabilities = {}) {
    assertWasmFile(filePath);
    const absolutePath = path.resolve(this.baseDir, filePath);
    const wasmBuffer = await fs.readFile(absolutePath);
    const normalizedCapabilities = normalizeCapabilities(capabilities);

    const imports = this.createImports(normalizedCapabilities);
    const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);

    return {
      instance,
      exports: instance.exports,
      capabilities: normalizedCapabilities,
      path: absolutePath,
    };
  }

  createImports(capabilities) {
    return {
      env: {
        log: (value) => {
          process.stdout.write(`[wasm] ${value}\n`);
        },
      },
      ultra: {
        has_capability: (namePtr) => {
          void namePtr;
          return 0;
        },
      },
      wasi_snapshot_preview1: this.createWasiStub(capabilities),
    };
  }

  // Minimal guard-first stub; expand to full WASI bindings as runtime matures.
  createWasiStub(capabilities) {
    return {
      fd_write: () => 0,
      proc_exit: () => 0,
      path_open: () => (capabilities.filesystem ? 0 : 76), // 76 = ENOTCAPABLE
      sock_open: () => (capabilities.network ? 0 : 76),
      environ_get: () => (capabilities.env ? 0 : 76),
      environ_sizes_get: () => (capabilities.env ? 0 : 76),
    };
  }
}

export default WasmRuntime;

/**
 * Error handler for runtime
 * @param {Error} error - Error to handle
 */
function handleRuntimeError(error) {
  try {
    console.error('[runtime]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
