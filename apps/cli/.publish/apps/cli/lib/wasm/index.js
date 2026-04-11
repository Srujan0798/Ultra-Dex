// Copyright (c) 2026 Ultra-Dex

import { wasmRuntime, WasmPlugin } from './runtime.js';
import { logger } from '../../lib/utils/logger.js';

export { wasmRuntime, WasmPlugin };

export default wasmRuntime;

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    logger.error('[index] ' + (error instanceof Error ? error.message : String(error)));
  } catch (_) {
    // Fail silently
  }
}
