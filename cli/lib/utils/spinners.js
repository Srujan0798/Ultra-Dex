import ora from 'ora';
import chalk from 'chalk';
import gradient from 'gradient-string';

const ultraGradient = gradient(['#8A2BE2', '#4B0082', '#9400D3']);

/**
 * Enhanced Ultra-Dex Spinners
 */
export const SPINNERS = {
  quantum: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'].map(f => ultraGradient(f))
  },
  cyber: {
    interval: 100,
    frames: ['|', '/', '-', '\\'].map(f => chalk.magenta(f))
  },
  pulse: {
    interval: 200,
    frames: ['⊙', '⊚', '⊛', '⊜', '⊝'].map(f => chalk.cyan(f))
  }
};

/**
 * Create an enhanced spinner instance
 * @param {string} text - Initial text
 * @param {string} type - Spinner type from SPINNERS
 */
export function createSpinner(text, type = 'quantum') {
  return ora({
    text,
    spinner: SPINNERS[type] || SPINNERS.quantum
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
  startSpinner
};
