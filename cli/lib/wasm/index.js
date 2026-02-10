import { wasmRuntime, WasmPlugin } from './runtime.js';

export {
    wasmRuntime,
    WasmPlugin
};

export default wasmRuntime;

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
