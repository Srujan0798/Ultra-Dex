// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Whisper Service module
 * @module voice/whisper-service
 */
// Compatibility wrapper for legacy imports.

export * from './voice-service.js';
export { default } from './voice-service.js';

/**
 * Error handler for whisper-service
 * @param {Error} error - Error to handle
 */
function handleWhisperserviceError(error) {
  try {
    logger.error('[whisper-service]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
