// Copyright (c) 2026 Ultra-Dex

import ora from 'ora';
import chalk from 'chalk';
import gradient from 'gradient-string';

const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

/**
 * Enhanced Ultra-Dex Spinners
 */
export const SPINNERS = {
  quantum: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'].map((f) => ultraGradient(f)),
  },
  cyber: {
    interval: 100,
    frames: ['|', '/', '-', '\\'].map((f) => ultraGradient(f)),
  },
  pulse: {
    interval: 200,
    frames: ['⊙', '⊚', '⊛', '⊜', '⊝'].map((f) => ultraGradient(f)),
  },
};

/**
 * Create an enhanced spinner instance
 * @param {string} text - Initial text
 * @param {string} type - Spinner type from SPINNERS
 */
export function createSpinner(text, type = 'quantum') {
  return ora({
    text,
    spinner: SPINNERS[type] || SPINNERS.quantum,
  });
}

/**
 * Start a spinner with gradient text
 */
export function startSpinner(text, type = 'quantum') {
  const spinner = createSpinner(text, type);
  return spinner.start();
}

export default {
  SPINNERS,
  createSpinner,
  startSpinner,
};

/**
 * Handle errors in spinners module
 * @param {Error} error - The error to handle
 * @param {string} [context='spinners'] - Error context
 */
function handleModuleError(error, context = 'spinners') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
