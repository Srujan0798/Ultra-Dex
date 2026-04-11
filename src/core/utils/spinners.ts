import ora from 'ora';
import gradient from 'gradient-string';
import { logger } from './logging.js';
const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);
const SPINNERS = {
  quantum: {
    interval: 80,
    frames: [
      '\u280B',
      '\u2819',
      '\u2839',
      '\u2838',
      '\u283C',
      '\u2834',
      '\u2826',
      '\u2827',
      '\u2807',
      '\u280F',
    ].map((f) => ultraGradient(f)),
  },
  cyber: {
    interval: 100,
    frames: ['|', '/', '-', '\\'].map((f) => ultraGradient(f)),
  },
  pulse: {
    interval: 200,
    frames: ['\u2299', '\u229A', '\u229B', '\u229C', '\u229D'].map((f) => ultraGradient(f)),
  },
};
function createSpinner(text, type = 'quantum') {
  return ora({
    text,
    spinner: SPINNERS[type] || SPINNERS.quantum,
  });
}
function startSpinner(text, type = 'quantum') {
  const spinner = createSpinner(text, type);
  return spinner.start();
}
var spinners_default = {
  SPINNERS,
  createSpinner,
  startSpinner,
};
function _handleModuleError(error, context = 'spinners') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Logging failure should not break spinner functionality
  }
}
export { SPINNERS, createSpinner, spinners_default as default, startSpinner };
