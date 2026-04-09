// Copyright (c) 2026 Ultra-Dex
// Project Nexus: WASM Runtime
// Safe execution environment for WebAssembly plugins

import fs from 'fs';

import { logger } from '../../lib/utils/logger.js';

export class WasmPlugin {
  constructor(_options = {}) {
    this.memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
    this.instance = null;
    this.api = null; // Exported functions
  }

  /**
   * Load and compile a WASM module
   * @param {string} filePath - Path to .wasm file
   */
  async load(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`WASM file not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);

    // Import Object: Defines what the WASM module can access (Sandboxing)
    const importObject = {
      env: {
        memory: this.memory,
        abort: () => logger.error('WASM Abort called'),
        log_string: (offset, length) => this.logString(offset, length),
        console_log: (val) => logger.info(`[WASM]: ${val}`),
      },
      // Capability-based security: Only expose specific host functions
      host: {
        read_file: () => {
          throw new Error('Security: read_file not allowed');
        },
        current_time: () => Date.now(),
      },
    };

    try {
      const { instance } = await WebAssembly.instantiate(buffer, importObject);
      this.instance = instance;
      this.api = instance.exports;
      return true;
    } catch (e) {
      throw new Error(`Failed to instantiate WASM module: ${e.message}`);
    }
  }

  /**
   * Run the main entry point of the plugin
   */
  run() {
    if (!this.api || !this.api.run) {
      throw new Error('Plugin does not export a "run" function');
    }
    return this.api.run();
  }

  /**
   * Helper to read string from WASM memory
   */
  logString(offset, length) {
    const bytes = new Uint8Array(this.memory.buffer, offset, length);
    const string = new TextDecoder('utf8').decode(bytes);
    logger.info(`[WASM Log]: ${string}`);
  }
}

export const wasmRuntime = {
  load: async (path) => {
    const plugin = new WasmPlugin();
    await plugin.load(path);
    return plugin;
  },
};

export default wasmRuntime;
