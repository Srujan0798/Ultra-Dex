// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { formatError, formatWarning, formatInfo, formatSuccess, formatStatus } from './status.js';

/**
 * Print an error message to the console
 * @param {string} message - Error message
 * @param {Error} [err] - Optional error object
 */
export function printError(message, err) {
  try {
    logger.log(formatError(message));
    if (err?.message) {
      logger.log(chalk.gray(`  → ${err.message}`));
    }
  } catch (e) {
    logger.error('Failed to print error:', e);
  }
}

/**
 * Print a warning message to the console
 * @param {string} message - Warning message
 */
export function printWarning(message) {
  try {
    logger.log(formatWarning(message));
  } catch (e) {
    logger.error('Failed to print warning:', e);
  }
}

/**
 * Print an info message to the console
 * @param {string} message - Info message
 */
export function printInfo(message) {
  try {
    logger.log(formatInfo(message));
  } catch (e) {
    logger.error('Failed to print info:', e);
  }
}

/**
 * Print a success message to the console
 * @param {string} message - Success message
 */
export function printSuccess(message) {
  try {
    logger.log(formatSuccess(message));
  } catch (e) {
    logger.error('Failed to print success:', e);
  }
}
