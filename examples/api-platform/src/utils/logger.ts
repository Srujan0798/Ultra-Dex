/**
 * @fileoverview Logger module
 * @module utils/logger
 */

import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.logging.level,
  transport:
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    env: config.nodeEnv,
    version: process.env.npm_package_version,
  },
});

export const createChildLogger = (bindings: Record<string, unknown>) => {
  return logger.child(bindings);
};

/**
 * Error handler for logger
 * @param {Error} error - Error to handle
 */
function handleLoggerError(error) {
  try {
    console.error('[logger]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
