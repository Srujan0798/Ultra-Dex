// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced output utilities using status.js and help.js
 * Provides consistent, styled output across all commands
 */

import chalk from 'chalk';
import { formatSuccess, formatError, formatWarning, formatInfo, formatLoading } from './status.js';
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
