// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced output utilities using status.js and help.js
 * Provides consistent, styled output across all commands
 */

import chalk from 'chalk';
import { formatSuccess, formatError, formatWarning, formatInfo, formatLoading, formatStatusCard } from './status.js';
import { formatHelpSection } from './help.js';

/**
 * Print success message with styled format
 */
export function printSuccess(message) {
  logger.log(formatSuccess(message));
}

/**
 * Print error message with styled format
 */
export function printError(message) {
  logger.error(formatError(message));
}

/**
 * Print warning message with styled format
 */
export function printWarning(message) {
  logger.log(formatWarning(message));
}

/**
 * Print info message with styled format
 */
export function printInfo(message) {
  logger.log(formatInfo(message));
}

/**
 * Print loading message with styled format
 */
export function printLoading(message) {
  logger.log(formatLoading(message));
}

/**
 * Print a status card
 */
export function printStatusCard(title, message, type = 'info') {
  logger.log(formatStatusCard(title, message, type));
}

/**
 * Print a formatted help section
 */
export function printHelpSection(title, content, options = {}) {
  logger.log(formatHelpSection(title, content, options));
}

export default {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printLoading,
  printStatusCard,
  printHelpSection,
};

/**
 * Handle errors in enhanced-output module
 * @param {Error} error - The error to handle
 * @param {string} [context='enhanced-output'] - Error context
 */
function handleModuleError(error, context = 'enhanced-output') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
