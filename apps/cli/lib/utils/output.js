// Copyright (c) 2026 Ultra-Dex

import { logger } from './logger.js';

/**
 * Print an error message to the console
 * @param {string} message - Error message
 * @param {Error} [err] - Optional error object
 */
export function printError(message, err) {
  logger.error(message, { 
    error: err?.message, 
    stack: process.env.DEBUG === 'true' ? err?.stack : undefined 
  });
}

/**
 * Print a warning message to the console
 * @param {string} message - Warning message
 */
export function printWarning(message) {
  logger.warn(message);
}

/**
 * Print an info message to the console
 * @param {string} message - Info message
 */
export function printInfo(message) {
  logger.info(message);
}

/**
 * Print a success message to the console
 * @param {string} message - Success message
 */
export function printSuccess(message) {
  logger.success(message);
}
