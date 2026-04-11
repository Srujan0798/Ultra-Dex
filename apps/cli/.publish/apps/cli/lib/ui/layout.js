// Copyright (c) 2026 Ultra-Dex

import { theme, ultraGradient } from './theme.js';
import { VERSION } from '../utils/version.js';
import { banner } from './banner.js';

export function showHeader(title = '') {
  console.clear();
  const gradientBanner = ultraGradient(banner);
  console.log(gradientBanner);
  console.log('');

  if (title) {
    const padding = Math.max(0, 30 - Math.floor(title.length / 2));
    console.log(' '.repeat(padding) + theme.title(title.toUpperCase()));
    console.log(' '.repeat(padding) + theme.primary('─'.repeat(title.length)));
    console.log('');
  }
}

export function showFooter() {
  console.log('');
  console.log(theme.dim('  ' + '─'.repeat(56)));
  console.log(
    `  ${theme.dim('Ultra-Dex v' + VERSION)} ${theme.dim('•')} ${theme.subtitle('Professional AI Orchestration')}`
  );
  console.log('');
}

export function showHelpFooter() {
  console.log('');
  console.log(theme.dim('  Type "h" for help, "q" to quit.'));
  console.log('');
}

export default {
  showHeader,
  showFooter,
  showHelpFooter,
};

/**
 * Handle errors in layout module
 * @param {Error} error - The error to handle
 * @param {string} [context='layout'] - Error context
 */
function _handleModuleError(error, context = 'layout') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
