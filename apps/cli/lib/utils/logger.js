// Copyright (c) 2026 Ultra-Dex

import chalk from '../../../../src/utils/chalk.js';
import figures from './figures.js';
import { isDoomsdayMode } from './theme-state.js';
import { redact } from './redactor.js';

/**
 * Log levels with numeric priorities
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * Standard icons for log levels
 */
const LEVEL_ICONS = {
  debug: figures.gear,
  info: figures.info,
  warn: figures.warning,
  error: figures.cross,
};

/**
 * Theme definitions for different CLI modes
 */
const THEMES = {
  default: {
    debug: chalk.gray,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
    success: chalk.green,
    muted: chalk.gray,
    dim: chalk.dim,
    bold: chalk.bold,
    accent: chalk.magenta,
  },
  doomsday: {
    debug: chalk.hex('#6b7280'),
    info: chalk.hex('#f59e0b'),
    warn: chalk.hex('#f97316'),
    error: chalk.hex('#dc2626'),
    success: chalk.hex('#22c55e'),
    muted: chalk.hex('#4b5563'),
    dim: chalk.dim,
    bold: chalk.bold,
    accent: chalk.hex('#ef4444'),
  },
};

function normalizeMeta(meta = {}) {
  const safeMeta = redact(meta);

  if (safeMeta && typeof safeMeta === 'object' && !Array.isArray(safeMeta)) {
    return safeMeta;
  }

  if (safeMeta === undefined) {
    return {};
  }

  return { value: safeMeta };
}

function pruneUndefined(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => pruneUndefined(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, pruneUndefined(entry)])
  );
}

function shouldDeliverToSink(event, sink = {}) {
  const { filter, eventTypes, levels, kinds } = sink;

  if (Array.isArray(eventTypes) && eventTypes.length && !eventTypes.includes(event.type)) {
    return false;
  }

  if (Array.isArray(levels) && levels.length && !levels.includes(event.level)) {
    return false;
  }

  if (Array.isArray(kinds) && kinds.length && !kinds.includes(event.kind)) {
    return false;
  }

  if (typeof filter === 'function') {
    return filter(event);
  }

  return true;
}

function createSharedState() {
  return {
    sinks: new Map(),
    nextEventId: 1,
  };
}

export function serializeEvent(event, { flattenData = false } = {}) {
  const payload = pruneUndefined({
    id: event.id,
    type: event.type,
    kind: event.kind,
    style: event.style,
    level: event.level,
    message: event.message,
    timestamp: event.timestamp,
    prefix: event.prefix,
    source: event.source,
  });

  if (flattenData) {
    return pruneUndefined({
      ...payload,
      ...(event.data || {}),
    });
  }

  return pruneUndefined({
    ...payload,
    data: event.data || {},
  });
}

/**
 * Enhanced Logger class with support for themed and structured (JSON) logging
 */
class Logger {
  /**
   * @param {Object} options
   * @param {string} [options.level='info'] - Minimum log level
   * @param {boolean} [options.quiet=false] - Silence console output
   * @param {string} [options.theme='default'] - UI theme name
   * @param {string} [options.prefix=''] - Global prefix for all logs
   * @param {boolean} [options.timestamps=true] - Show timestamps in output
   * @param {boolean} [options.colorize=true] - Use colors in output
   * @param {boolean} [options.json=false] - Output logs as structured JSON
   */
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.quiet = options.quiet || false;
    this.theme = options.theme || 'default';
    this.prefix = options.prefix || '';
    this.timestamps = options.timestamps !== false;
    this.colorize = options.colorize !== false;
    this.json = options.json || false;
    this._customTheme = options.customTheme || null;
    this.history = [];
    this.maxHistory = options.maxHistory || 1000;
    this._sharedState = options.sharedState || createSharedState();

    this._ensureBuiltInSinks();
  }

  get currentLevel() {
    return LOG_LEVELS[this.level] ?? LOG_LEVELS.info;
  }

  /**
   * Set the minimum log level
   * @param {string} level - one of 'debug', 'info', 'warn', 'error', 'silent'
   */
  setLevel(level) {
    if (Object.prototype.hasOwnProperty.call(LOG_LEVELS, level)) {
      this.level = level;
    }
  }

  /**
   * Toggle JSON output mode
   * @param {boolean} enabled
   */
  setJsonMode(enabled) {
    this.json = !!enabled;
  }

  /**
   * Get the current active theme based on global state and options
   */
  getTheme() {
    if (this._customTheme) return this._customTheme;
    if (isDoomsdayMode()) return THEMES.doomsday;
    return THEMES[this.theme] || THEMES.default;
  }

  /**
   * Format a log message for terminal display
   */
  formatMessage(level, message, meta = {}) {
    const theme = this.getTheme();
    const colorFn = theme[level] || chalk.white;
    const icon = LEVEL_ICONS[level] || '';
    const safeMeta = normalizeMeta(meta);
    const parts = [];

    if (this.timestamps) {
      const timestamp = new Date().toISOString();
      parts.push(theme.muted(`[${timestamp}]`));
    }

    if (this.prefix) {
      parts.push(theme.muted(this.prefix));
    }

    if (icon && this.colorize) {
      parts.push(colorFn(icon));
    }

    parts.push(colorFn(message));

    if (safeMeta.detail) {
      parts.push(theme.muted(`· ${safeMeta.detail}`));
    }

    if (safeMeta.context && this.colorize) {
      parts.push(theme.muted(`(${safeMeta.context})`));
    }

    const extraMeta = { ...safeMeta };
    delete extraMeta.detail;
    delete extraMeta.context;

    if (Object.keys(extraMeta).length > 0) {
      parts.push(theme.dim(JSON.stringify(extraMeta)));
    }

    return parts.join(' ');
  }

  /**
   * Determine if a message should be emitted based on current level
   */
  shouldLog(level) {
    return LOG_LEVELS[level] >= this.currentLevel;
  }

  _ensureBuiltInSinks() {
    if (this._sharedState.sinks.has('console')) return;

    this.subscribe(
      'console',
      (event) => {
        const activeLogger = event.logger || this;
        activeLogger._writeConsoleEvent(event);
      },
      {
        filter: (event) =>
          event.console !== false && (event.kind === 'log' || event.console === true),
      }
    );
  }

  subscribe(name, handler, options = {}) {
    this._sharedState.sinks.set(name, {
      name,
      handler,
      ...options,
    });

    return () => {
      this.unsubscribe(name);
    };
  }

  unsubscribe(name) {
    return this._sharedState.sinks.delete(name);
  }

  async dispatch(event) {
    const deliveries = [];

    for (const sink of this._sharedState.sinks.values()) {
      if (!shouldDeliverToSink(event, sink)) continue;

      deliveries.push(
        Promise.resolve()
          .then(() => sink.handler(event))
          .catch(() => {
            // Logging sinks must never break the caller.
          })
      );
    }

    await Promise.allSettled(deliveries);
    return event;
  }

  dispatchSync(event) {
    for (const sink of this._sharedState.sinks.values()) {
      if (!shouldDeliverToSink(event, sink)) continue;

      try {
        const result = sink.handler(event);
        if (result && typeof result.then === 'function') {
          result.catch(() => {
            // Logging sinks must never break the caller.
          });
        }
      } catch {
        // Logging sinks must never break the caller.
      }
    }

    return event;
  }

  createEvent(type, payload = {}, options = {}) {
    const safeData = normalizeMeta(payload);
    const safeMessage = options.message === undefined ? undefined : redact(options.message);

    const event = pruneUndefined({
      id: this._sharedState.nextEventId++,
      type,
      kind: options.kind || 'event',
      style: options.style,
      level: options.level,
      message: safeMessage,
      timestamp: options.timestamp || new Date().toISOString(),
      prefix: this.prefix || undefined,
      source: options.source || 'logger',
      console: options.console,
      data: safeData,
    });

    event.logger = this;
    return event;
  }

  async event(type, payload = {}, options = {}) {
    const event = this.createEvent(type, payload, options);

    if (options.history !== false && event.kind === 'log' && event.message) {
      this._pushHistory(event);
    }

    await this.dispatch(event);
    return event;
  }

  emit(type, payload = {}, options = {}) {
    return this.event(type, payload, options);
  }

  _pushHistory(event) {
    this.history.push({
      timestamp: event.timestamp,
      level: event.level || 'info',
      message: event.message,
      meta: event.data || {},
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return null;

    const safeMessage = redact(message);
    const safeMeta = normalizeMeta(meta);

    const event = this.createEvent('log.entry', safeMeta, {
      kind: 'log',
      style: 'message',
      level,
      message: safeMessage,
      console: !this.quiet,
    });

    this._pushHistory(event);
    this.dispatchSync(event);
    return event;
  }

  debug(message, meta = {}) {
    if (process.env.DEBUG && !this.shouldLog('debug')) {
      const previousLevel = this.level;
      this.level = 'debug';
      try {
        return this.log('debug', message, meta);
      } finally {
        this.level = previousLevel;
      }
    }

    if (!process.env.DEBUG && this.currentLevel > LOG_LEVELS.debug) return null;
    return this.log('debug', message, meta);
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  /**
   * Log a success message with a checkmark
   */
  success(message, meta = {}) {
    if (!this.shouldLog('info')) return null;

    const event = this.createEvent(
      'log.success',
      { ...normalizeMeta(meta), status: 'success' },
      {
        kind: 'log',
        style: 'success',
        level: 'info',
        message: redact(message),
        console: !this.quiet,
      }
    );

    this._pushHistory(event);
    this.dispatchSync(event);
    return event;
  }

  /**
   * Log a step in a multi-step process
   */
  step(current, total, message) {
    if (!this.shouldLog('info')) return null;

    const event = this.createEvent(
      'log.step',
      { step: current, total },
      {
        kind: 'log',
        style: 'step',
        level: 'info',
        message: redact(message),
        console: !this.quiet,
        history: false,
      }
    );

    this.dispatchSync(event);
    return event;
  }

  /**
   * Log a prominent header
   */
  header(text) {
    if (!this.shouldLog('info')) return null;

    const event = this.createEvent(
      'log.header',
      {},
      {
        kind: 'log',
        style: 'header',
        level: 'info',
        message: redact(text),
        console: !this.quiet,
        history: false,
      }
    );

    this.dispatchSync(event);
    return event;
  }

  /**
   * Log a blank line for spacing
   */
  spacer() {
    if (!this.shouldLog('info')) return null;

    const event = this.createEvent(
      'log.spacer',
      {},
      {
        kind: 'log',
        style: 'spacer',
        level: 'info',
        console: !this.quiet,
        history: false,
      }
    );

    this.dispatchSync(event);
    return event;
  }

  /**
   * Log data in a simple table format
   */
  table(data) {
    if (!this.shouldLog('info')) return null;

    const event = this.createEvent(
      'log.table',
      { rows: Array.isArray(data) ? data : [] },
      {
        kind: 'log',
        style: 'table',
        level: 'info',
        console: !this.quiet,
        history: false,
      }
    );

    this.dispatchSync(event);
    return event;
  }

  _writeConsoleEvent(event) {
    if (this.json) {
      this._writeJsonConsoleEvent(event);
      return;
    }

    switch (event.style) {
      case 'success':
        this._writeSuccessConsoleEvent(event);
        return;
      case 'step':
        this._writeStepConsoleEvent(event);
        return;
      case 'header':
        this._writeHeaderConsoleEvent(event);
        return;
      case 'spacer':
        console.log('');
        return;
      case 'table':
        this._writeTableConsoleEvent(event);
        return;
      default:
        console.log(this.formatMessage(event.level || 'info', event.message || '', event.data));
    }
  }

  _writeJsonConsoleEvent(event) {
    if (event.style === 'spacer') return;

    if (event.style === 'table') {
      console.log(JSON.stringify({ type: 'table', data: event.data?.rows || [] }));
      return;
    }

    console.log(JSON.stringify(serializeEvent(event, { flattenData: true })));
  }

  _writeSuccessConsoleEvent(event) {
    const theme = this.getTheme();
    const icon = this.colorize ? theme.success(figures.tick) : figures.tick;
    const prefixParts = [];

    if (this.timestamps) {
      prefixParts.push(theme.muted(`[${event.timestamp}]`));
    }

    if (this.prefix) {
      prefixParts.push(theme.muted(this.prefix));
    }

    let output = [...prefixParts, icon, theme.success(event.message || '')].join(' ');

    if (event.data?.detail) {
      output += ' ' + theme.muted(`· ${event.data.detail}`);
    }

    console.log(output);
  }

  _writeStepConsoleEvent(event) {
    const theme = this.getTheme();
    console.log(`  ${theme.muted(`[${event.data?.step}/${event.data?.total}]`)} ${event.message || ''}`);
  }

  _writeHeaderConsoleEvent(event) {
    const theme = this.getTheme();
    const safeText = event.message || '';
    console.log('');
    console.log(theme.bold(`  ${safeText}`));
    console.log(theme.muted('  ' + '─'.repeat(Math.max(10, safeText.length + 4))));
  }

  _writeTableConsoleEvent(event) {
    for (const row of event.data?.rows || []) {
      console.log(row.map((cell) => String(cell)).join('\t'));
    }
  }

  /**
   * Change theme after instantiation
   */
  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.theme = themeName;
    }
  }

  /**
   * Set a custom theme object
   */
  setCustomTheme(customTheme) {
    this._customTheme = customTheme;
  }

  /**
   * Create a child logger with inherited settings but optional overrides (e.g. prefix)
   */
  child(options = {}) {
    return new Logger({
      level: this.level,
      quiet: this.quiet,
      theme: this.theme,
      prefix: this.prefix,
      timestamps: this.timestamps,
      colorize: this.colorize,
      json: this.json,
      customTheme: this._customTheme,
      sharedState: this._sharedState,
      ...options,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class and other members
export default logger;
export { Logger, LOG_LEVELS, THEMES };
