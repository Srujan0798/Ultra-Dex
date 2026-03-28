// Copyright (c) 2026 Ultra-Dex

import gradient from '../../../../src/utils/gradient-string.js';

const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

function createFallbackSpinner(options = {}) {
  return {
    text: options.text || '',
    spinner: options.spinner,
    isSpinning: false,
    start() {
      this.isSpinning = true;
      return this;
    },
    stop() {
      this.isSpinning = false;
      return this;
    },
    succeed(message) {
      if (message) this.text = message;
      this.isSpinning = false;
      return this;
    },
    fail(message) {
      if (message) this.text = message;
      this.isSpinning = false;
      return this;
    },
  };
}

let oraFactory = (options) => createFallbackSpinner(options);

try {
  const mod = await import('ora');
  const resolvedOra = mod.default ?? mod;
  oraFactory = (options) => resolvedOra(options);
} catch {
  oraFactory = (options) => createFallbackSpinner(options);
}

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
  return oraFactory({
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
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
