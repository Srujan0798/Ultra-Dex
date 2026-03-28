// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import figures from 'figures';
import { isDoomsdayMode } from './theme-state.js';
import { redact } from './redactor.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const LEVEL_COLORS = {
  debug: 'gray',
  info: 'cyan',
  warn: 'yellow',
  error: 'red',
};

const LEVEL_ICONS = {
  debug: figures.gear,
  info: figures.info,
  warn: figures.warning,
  error: figures.cross,
};

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
  },
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.quiet = options.quiet || false;
    this.theme = options.theme || 'default';
    this.prefix = options.prefix || '';
    this.timestamps = options.timestamps !== false;
    this.colorize = options.colorize !== false;
    this._customTheme = options.customTheme || null;
  }

  get currentLevel() {
    return LOG_LEVELS[this.level] ?? LOG_LEVELS.info;
  }

  setLevel(level) {
    if (LOG_LEVELS.hasOwnProperty(level)) {
      this.level = level;
    }
  }

  getTheme() {
    if (this._customTheme) return this._customTheme;
    if (isDoomsdayMode()) return THEMES.doomsday;
    return THEMES[this.theme] || THEMES.default;
  }

  formatMessage(level, message, meta = {}) {
    const theme = this.getTheme();
    const colorFn = theme[level] || chalk.white;
    const icon = LEVEL_ICONS[level] || '';

    let parts = [];

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

    if (meta.detail) {
      parts.push(theme.muted(`· ${meta.detail}`));
    }

    if (meta.context && this.colorize) {
      parts.push(theme.muted(`(${meta.context})`));
    }

    return parts.join(' ');
  }

  shouldLog(level) {
    if (this.quiet) return false;
    return LOG_LEVELS[level] >= this.currentLevel;
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const safeMessage = redact(message);
    const formatted = this.formatMessage(level, safeMessage, meta);
    console.log(formatted);
  }

  debug(message, meta = {}) {
    if (!process.env.DEBUG) return;
    this.log('debug', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  success(message, meta = {}) {
    const theme = this.getTheme();
    if (!this.shouldLog('info')) return;

    const safeMessage = redact(message);
    const icon = this.colorize ? theme.success(figures.tick) : figures.tick;
    let output = icon + ' ' + theme.success(safeMessage);

    if (meta.detail) {
      output += ' ' + theme.muted(`· ${redact(meta.detail)}`);
    }

    console.log(output);
  }

  step(current, total, message) {
    if (this.quiet) return;
    const theme = this.getTheme();
    const safeMessage = redact(message);
    console.log(`  ${theme.muted(`[${current}/${total}]`)} ${safeMessage}`);
  }

  header(text) {
    if (this.quiet) return;
    const theme = this.getTheme();
    const safeText = redact(text);
    console.log('');
    console.log(theme.bold(`  ${safeText}`));
    console.log(theme.muted('  ' + '─'.repeat(Math.max(10, safeText.length + 4))));
  }

  spacer() {
    if (this.quiet) return;
    console.log('');
  }

  table(data) {
    if (this.quiet) return;
    const theme = this.getTheme();
    for (const row of data) {
      const formatted = row.map((cell) => String(cell)).join('\t');
      console.log(formatted);
    }
  }

  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.theme = themeName;
    }
  }

  setCustomTheme(customTheme) {
    this._customTheme = customTheme;
  }

  child(options = {}) {
    return new Logger({
      ...{
        level: this.level,
        quiet: this.quiet,
        theme: this.theme,
        timestamps: this.timestamps,
        colorize: this.colorize,
        customTheme: this._customTheme,
      },
      ...options,
    });
  }
}

export const logger = new Logger();
export default logger;
export { Logger, LOG_LEVELS, THEMES };
