// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Unified Design System Theme Module
 * @module ui/theme
 * @description Central theme system enforcing all color usage through theme helper
 */

import chalk from 'chalk';
import gradient from 'gradient-string';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { getTheme, setTheme, themes } from '../config/theme.js';
import { setDoomsdayMode, isDoomsdayMode } from '../utils/theme-state.js';
import { doomsdayStatusIcons } from '../assets/art/doomsday.js';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const DEFAULT_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#d946ef',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  dim: '#71717a',
  muted: '#52525b',
  background: '#0a0a0a',
  surface: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
};

// Semantic color mappings
const SEMANTIC_COLORS = {
  brand: 'primary',
  link: 'secondary',
  danger: 'error',
  critical: 'error',
  positive: 'success',
  neutral: 'muted',
};

// ============================================================================
// THEME RESOLUTION
// ============================================================================

function resolveThemeName() {
  const envTheme = process.env.ULTRA_DEX_THEME || process.env.ULTRA_DEX_UI_THEME;
  if (envTheme && themes[envTheme]) return envTheme;

  const configPaths = [
    path.join(process.cwd(), '.ultra-dex', 'config.json'),
    path.join(homedir(), '.ultra-dex', 'config.json'),
  ];

  for (const configPath of configPaths) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(raw);
      const configured = config?.ui?.theme || config?.theme;
      if (configured && themes[configured]) return configured;
    } catch {
      // ignore
    }
  }

  return 'default';
}

const resolvedThemeName = resolveThemeName();
setTheme(resolvedThemeName);
setDoomsdayMode(resolvedThemeName === 'doomsday');

export const themeColors = {
  ...DEFAULT_COLORS,
  ...getTheme(),
};

// ============================================================================
// THEME HELPER CLASS
// ============================================================================

/**
 * Theme Helper - Unified design system accessor
 * All color usage MUST go through this helper
 */
export class ThemeHelper {
  constructor(colors) {
    this.colors = colors;
    this.cache = new Map();
    this._createColorFunctions();
  }

  _createColorFunctions() {
    // Create chalk instances for each color
    Object.entries(this.colors).forEach(([key, hex]) => {
      this.cache.set(key, chalk.hex(hex));
    });

    // Create semantic aliases
    Object.entries(SEMANTIC_COLORS).forEach(([semantic, base]) => {
      if (this.cache.has(base)) {
        this.cache.set(semantic, this.cache.get(base));
      }
    });
  }

  /**
   * Get color function by name
   * @param {string} name - Color name
   * @returns {Function} Chalk color function
   */
  get(name) {
    const colorFn = this.cache.get(name);
    if (!colorFn) {
      console.warn(`[Theme] Unknown color: ${name}`);
      return chalk.white;
    }
    return colorFn;
  }

  /**
   * Apply color with modifiers
   * @param {string} name - Color name
   * @param {string} text - Text to colorize
   * @param {Object} modifiers - Style modifiers
   * @returns {string} Colored text
   */
  color(name, text, modifiers = {}) {
    let result = this.get(name)(text);
    if (modifiers.bold) result = chalk.bold(result);
    if (modifiers.dim) result = chalk.dim(result);
    if (modifiers.underline) result = chalk.underline(result);
    if (modifiers.inverse) result = chalk.inverse(result);
    return result;
  }

  /**
   * Get gradient function
   * @returns {Function} Gradient function
   */
  getGradient() {
    return gradient([this.colors.primary, this.colors.accent || this.colors.secondary]);
  }

  /**
   * Get all color names
   * @returns {string[]} Array of color names
   */
  getColorNames() {
    return Array.from(this.cache.keys());
  }

  /**
   * Validate color name exists
   * @param {string} name - Color name to validate
   * @returns {boolean} True if valid
   */
  isValidColor(name) {
    return this.cache.has(name);
  }
}

// Create singleton instance
export const themeHelper = new ThemeHelper(themeColors);

// ============================================================================
// GRADIENT
// ============================================================================

const baseGradient = themeHelper.getGradient();
export const ultraGradient = (str) => baseGradient.multiline(str);

// ============================================================================
// THEME API (Backward Compatible)
// ============================================================================

export const theme = {
  primary: themeHelper.get('primary'),
  secondary: themeHelper.get('secondary'),
  accent: themeHelper.get('accent'),
  success: themeHelper.get('success'),
  error: themeHelper.get('error'),
  warning: themeHelper.get('warning'),
  info: themeHelper.get('info'),
  title: chalk.hex(themeColors.primary).bold,
  subtitle: chalk.hex(themeColors.secondary),
  dim: themeHelper.get('dim'),
  muted: themeHelper.get('muted'),
  highlight: chalk.hex(themeColors.primary).inverse,
  link: chalk.hex(themeColors.secondary).underline,
  code: themeHelper.get('accent'),
  text: themeHelper.get('text'),
  textSecondary: themeHelper.get('textSecondary'),
  background: themeHelper.get('background'),
  surface: themeHelper.get('surface'),
  border: themeHelper.get('border'),
  
  // Helper reference
  helper: themeHelper,
  
  // Direct color access through helper
  color: (name, text, modifiers) => themeHelper.color(name, text, modifiers),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, ''); // eslint-disable-line no-control-regex
}

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

const LAYOUT_CONSTANTS = {
  boxWidth: 60,
  headerWidth: 56,
  defaultDividerWidth: 60,
};

export function box(content, title = '') {
  const width = LAYOUT_CONSTANTS.boxWidth;
  const border = theme.primary;
  const top = border('╭' + '─'.repeat(width - 2) + '╮');
  const bottom = border('╰' + '─'.repeat(width - 2) + '╯');
  const side = border('│');
  const lines = content.split('\n');
  const paddedLines = lines.map((line) => {
    const padding = width - 4 - stripAnsi(line).length;
    return `${side} ${line}${' '.repeat(Math.max(0, padding))} ${side}`;
  });
  let titleBar = '';
  if (title) {
    const titlePadding = Math.floor((width - 4 - title.length) / 2);
    titleBar =
      border('│') +
      ' '.repeat(titlePadding) +
      theme.title(title) +
      ' '.repeat(width - 4 - titlePadding - title.length) +
      border('│') +
      '\n';
    titleBar += border('├' + '─'.repeat(width - 2) + '┤') + '\n';
  }
  return top + '\n' + titleBar + paddedLines.join('\n') + '\n' + bottom;
}

export function divider(char = '─', width = LAYOUT_CONSTANTS.defaultDividerWidth) {
  return theme.dim(char.repeat(width));
}

// ============================================================================
// OUTPUT FUNCTIONS (Use Logger instead for new code)
// ============================================================================

export function header(text) {
  console.log('');
  console.log(theme.title(`  ${text}`));
  console.log(theme.primary('  ' + '─'.repeat(LAYOUT_CONSTANTS.headerWidth)));
}

export function subheader(text) {
  console.log(theme.subtitle(`  ${text}`));
}

// ============================================================================
// STATUS INDICATORS
// ============================================================================

export const status = {
  success: theme.success(isDoomsdayMode() ? doomsdayStatusIcons.success : '✓'),
  error: theme.error(isDoomsdayMode() ? doomsdayStatusIcons.error : '✖'),
  warning: theme.warning(isDoomsdayMode() ? doomsdayStatusIcons.warning : '⚠'),
  info: theme.info(isDoomsdayMode() ? doomsdayStatusIcons.info : 'ℹ'),
  pending: theme.dim(isDoomsdayMode() ? doomsdayStatusIcons.pending : '○'),
  running: theme.accent(isDoomsdayMode() ? doomsdayStatusIcons.running : '⟳'),
  arrow: theme.primary('→'),
  bullet: theme.dim('•'),
};

export function statusLine(icon, text, detail = '') {
  const detailText = detail ? theme.dim(` · ${detail}`) : '';
  console.log(`  ${icon} ${text}${detailText}`);
}

// ============================================================================
// DATA VISUALIZATION
// ============================================================================

export function table(headers, rows) {
  const colWidths = headers.map((h, i) => {
    const maxRow = Math.max(...rows.map((r) => String(r[i] || '').length));
    return Math.max(h.length, maxRow) + 2;
  });
  const border = theme.dim;
  console.log(border('  ┌' + colWidths.map((w) => '─'.repeat(w)).join('┬') + '┐'));
  const headerRow = headers
    .map((h, i) => theme.title(h.padEnd(colWidths[i] - 2)))
    .join(border(' │ '));
  console.log(border('  │ ') + headerRow + border(' │'));
  console.log(border('  ├' + colWidths.map((w) => '─'.repeat(w)).join('┼') + '┤'));
  rows.forEach((row) => {
    const rowText = row
      .map((cell, i) => String(cell || '').padEnd(colWidths[i] - 2))
      .join(border(' │ '));
    console.log(border('  │ ') + rowText + border(' │'));
  });
  console.log(border('  └' + colWidths.map((w) => '─'.repeat(w)).join('┴') + '┘'));
}

export function progressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  const bar = theme.primary('█'.repeat(filled)) + theme.dim('░'.repeat(empty));
  return `${bar} ${theme.secondary(percentage + '%')}`;
}

export function loadingDots() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r  ${theme.accent(frames[i])} `);
    i = (i + 1) % frames.length;
  }, 80);
}

export function keyHints(hints) {
  const formattedHints = hints
    .map(([key, action]) => `${theme.highlight(` ${key} `)} ${theme.dim(action)}`)
    .join('  ');
  console.log('');
  console.log(`  ${formattedHints}`);
}

// ============================================================================
// MODULE ERROR HANDLING
// ============================================================================

function handleModuleError(error, context = 'theme') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}

export default {
  theme,
  themeHelper,
  themeColors,
  ultraGradient,
  stripAnsi,
  box,
  divider,
  header,
  subheader,
  status,
  statusLine,
  table,
  progressBar,
  loadingDots,
  keyHints,
};
