// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Unified Logger Class
 * @module ui/logger
 * @description Centralized logging system replacing console.log calls with themed output
 */

import { theme } from './theme.js';
import { formatError, formatWarning, formatInfo, formatSuccess } from '../utils/status.js';

// ============================================================================
// LOG LEVELS
// ============================================================================

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  showTimestamp: false,
  showModule: true,
  minErrorLevel: LOG_LEVELS.ERROR,
};

// ============================================================================
// LOGGER CLASS
// ============================================================================

/**
 * Unified Logger Class
 * Replaces console.log with themed, consistent output
 */
export class Logger {
  /**
   * Create a Logger instance
   * @param {Object} config - Logger configuration
   * @param {number} [config.level] - Log level threshold
   * @param {boolean} [config.showTimestamp] - Show timestamps
   * @param {boolean} [config.showModule] - Show module names
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.module = config.module || 'cli';
    this.logs = [];
  }

  /**
   * Set the module name for log context
   * @param {string} moduleName - Module name
   */
  setModule(moduleName) {
    this.module = moduleName;
  }

  /**
   * Set log level
   * @param {number|string} level - Log level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.config.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    } else {
      this.config.level = level;
    }
  }

  /**
   * Enable/disable timestamps
   * @param {boolean} show - Whether to show timestamps
   */
  showTimestamps(show) {
    this.config.showTimestamp = show;
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted timestamp
   */
  _getTimestamp() {
    if (!this.config.showTimestamp) return '';
    return theme.dim(`[${new Date().toISOString().split('T')[1].split('.')[0]}]`);
  }

  /**
   * Get module prefix
   * @returns {string} Module prefix
   */
  _getModulePrefix() {
    if (!this.config.showModule) return '';
    return theme.dim(`[${this.module}]`);
  }

  /**
   * Store log entry
   * @param {Object} entry - Log entry
   */
  _storeLog(entry) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      ...entry,
    });

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  // ============================================================================
  // PRIMARY LOGGING METHODS
  // ============================================================================

  /**
   * Log debug message (only shown in debug mode)
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Additional metadata
   */
  debug(message, metadata = {}) {
    if (this.config.level > LOG_LEVELS.DEBUG) return;

    const timestamp = this._getTimestamp();
    const modulePrefix = this._getModulePrefix();
    const output = `${timestamp} ${modulePrefix} ${theme.dim('DEBUG')} ${message}`;

    logger.log(output);
    this._storeLog({ level: 'debug', message, metadata });
  }

  /**
   * Log info message (default level)
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Additional metadata
   */
  info(message, metadata = {}) {
    if (this.config.level > LOG_LEVELS.INFO) return;

    const timestamp = this._getTimestamp();
    const modulePrefix = this._getModulePrefix();
    const output = `${timestamp} ${modulePrefix} ${formatInfo(message)}`;

    logger.log(output);
    this._storeLog({ level: 'info', message, metadata });
  }

  /**
   * Log success message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Additional metadata
   */
  success(message, metadata = {}) {
    if (this.config.level > LOG_LEVELS.INFO) return;

    const timestamp = this._getTimestamp();
    const modulePrefix = this._getModulePrefix();
    const output = `${timestamp} ${modulePrefix} ${formatSuccess(message)}`;

    logger.log(output);
    this._storeLog({ level: 'success', message, metadata });
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Additional metadata
   */
  warn(message, metadata = {}) {
    if (this.config.level > LOG_LEVELS.WARN) return;

    const timestamp = this._getTimestamp();
    const modulePrefix = this._getModulePrefix();
    const output = `${timestamp} ${modulePrefix} ${formatWarning(message)}`;

    logger.log(output);
    this._storeLog({ level: 'warn', message, metadata });
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Error} [error] - Optional error object
   * @param {Object} [metadata] - Additional metadata
   */
  error(message, error = null, metadata = {}) {
    if (this.config.level > LOG_LEVELS.ERROR) return;

    const timestamp = this._getTimestamp();
    const modulePrefix = this._getModulePrefix();
    const output = `${timestamp} ${modulePrefix} ${formatError(message)}`;

    logger.log(output);

    if (error?.message) {
      logger.log(theme.dim(`  → ${error.message}`));
      if (error.stack) {
        logger.log(theme.dim(error.stack.split('\n').slice(1).join('\n')));
      }
    }

    this._storeLog({ level: 'error', message, error: error?.message, metadata });
  }

  // ============================================================================
  // SPECIALIZED LOGGING METHODS
  // ============================================================================

  /**
   * Log a command execution
   * @param {string} command - Command being executed
   * @param {Object} [options] - Command options
   */
  command(command, options = {}) {
    this.info(`${theme.bold('Executing:')} ${theme.code(command)}`);
    if (Object.keys(options).length > 0) {
      this.debug(`Options: ${JSON.stringify(options, null, 2)}`);
    }
  }

  /**
   * Log a step in a process
   * @param {number} current - Current step number
   * @param {number} total - Total steps
   * @param {string} message - Step description
   */
  step(current, total, message) {
    const stepInfo = theme.primary(`[${current}/${total}]`);
    this.info(`${stepInfo} ${message}`);
  }

  /**
   * Log progress
   * @param {string} message - Progress message
   * @param {number} [percentage] - Optional percentage (0-100)
   */
  progress(message, percentage = null) {
    const percentageText = percentage !== null ? theme.secondary(` (${percentage}%)`) : '';
    this.info(`${theme.accent('⟳')} ${message}${percentageText}`);
  }

  /**
   * Log a data object as a table-like format
   * @param {Object} data - Data to display
   */
  data(data) {
    if (!data || typeof data !== 'object') return;

    Object.entries(data).forEach(([key, value]) => {
      logger.log(`  ${theme.secondary(key)}: ${theme.text(String(value))}`);
    });
  }

  /**
   * Log a list with bullet points
   * @param {string[]} items - Items to list
   * @param {string} [icon] - Optional icon for each item
   */
  list(items, icon = '•') {
    items.forEach((item) => {
      logger.log(`  ${theme.dim(icon)} ${item}`);
    });
  }

  /**
   * Log a code block
   * @param {string} code - Code to display
   * @param {string} [language] - Language hint
   */
  codeBlock(code, language = '') {
    const lines = code.split('\n');
    const border = theme.dim('│');

    logger.log(theme.dim('┌' + '─'.repeat(56) + '┐'));
    if (language) {
      logger.log(`${border} ${theme.code(language.toUpperCase())}`.padEnd(59) + theme.dim('│'));
      logger.log(theme.dim('├' + '─'.repeat(56) + '┤'));
    }
    lines.forEach((line) => {
      logger.log(`${border} ${theme.code(line)}`.padEnd(59) + theme.dim('│'));
    });
    logger.log(theme.dim('└' + '─'.repeat(56) + '┘'));
  }

  /**
   * Log a horizontal divider
   */
  divider() {
    logger.log(theme.dim('  ' + '─'.repeat(56)));
  }

  /**
   * Log blank lines for spacing
   * @param {number} [count=1] - Number of blank lines
   */
  blank(count = 1) {
    for (let i = 0; i < count; i++) {
      logger.log('');
    }
  }

  // ============================================================================
  // LOG RETRIEVAL
  // ============================================================================

  /**
   * Get recent logs
   * @param {number} [count=10] - Number of logs to retrieve
   * @returns {Object[]} Recent logs
   */
  getRecentLogs(count = 10) {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   * @param {string} level - Log level to filter
   * @returns {Object[]} Filtered logs
   */
  getLogsByLevel(level) {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear log history
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ============================================================================
// PRECONFIGURED LOGGER INSTANCES
// ============================================================================

/**
 * Create a logger for a specific command
 * @param {string} commandName - Command name
 * @returns {Logger} Configured logger
 */
export function createCommandLogger(commandName) {
  return new Logger({
    module: commandName,
    showTimestamp: process.env.DEBUG === 'true',
  });
}

/**
 * Create a logger for a specific module
 * @param {string} moduleName - Module name
 * @returns {Logger} Configured logger
 */
export function createModuleLogger(moduleName) {
  return new Logger({
    module: moduleName,
    showModule: true,
  });
}

/**
 * Create a minimal logger (no module prefix)
 * @returns {Logger} Minimal logger
 */
export function createMinimalLogger() {
  return new Logger({
    showModule: false,
  });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default logger instance for general use
 */
export const logger = new Logger({
  module: 'cli',
  showModule: true,
});

export default logger;

// ============================================================================
// MODULE ERROR HANDLING
// ============================================================================

/**
 * Handle errors in logger module
 * @param {Error} error - The error to handle
 * @param {string} [context='logger'] - Error context
 */
function handleModuleError(error, context = 'logger') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
