// Copyright (c) 2026 Ultra-Dex
// Predictive Debugging Module Index

export { PredictiveDebugger } from './debugger.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
