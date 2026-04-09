// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced output utilities using status.js and help.js
 * Provides consistent, styled output across all commands
 */

import {
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatLoading,
  formatStatusCard,
} from './status.js';
import { formatHelpSection } from './help.js';

/**
 * Print success message with styled format
 */
export function printSuccess(message) {
  console.log(formatSuccess(message));
}

/**
 * Print error message with styled format
 */
export function printError(message) {
  console.error(formatError(message));
}

/**
 * Print warning message with styled format
 */
export function printWarning(message) {
  console.log(formatWarning(message));
}

/**
 * Print info message with styled format
 */
export function printInfo(message) {
  console.log(formatInfo(message));
}

/**
 * Print loading message with styled format
 */
export function printLoading(message) {
  console.log(formatLoading(message));
}

/**
 * Print a status card
 */
export function printStatusCard(title, message, type = 'info') {
  console.log(formatStatusCard(title, message, type));
}

/**
 * Print a formatted help section
 */
export function printHelpSection(title, content, options = {}) {
  console.log(formatHelpSection(title, content, options));
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
function _handleModuleError(error, context = 'enhanced-output') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
