// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex CLI — UI Export Index

export {
  theme,
  box,
  divider,
  header,
  subheader,
  status,
  statusLine,
  table,
  progressBar,
  keyHints,
} from './theme.js';
export {
  showStartup,
  showMainInterface,
  showStatus,
  showAgentsList,
  showSwarmPipeline,
  showHelp,
} from './interface.js';
export {
  createSpinner,
  startLoading,
  succeed,
  fail,
  runTaskList,
  typeText,
  countdown,
} from './spinners.js';

// Export utility functions
export { printSuccess, printInfo, printError, printWarning, printTable } from './logger.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
