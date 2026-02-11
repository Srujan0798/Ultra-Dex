// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Theme module
 * @module ui/theme
 */

// Ultra-Dex CLI — Red to Purple (Vertical)
// Clean Red-to-Purple top-to-bottom transition

import chalk from 'chalk';
import gradient from 'gradient-string';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { getTheme, setTheme, themes } from '../config/theme.js';
import { setDoomsdayMode, isDoomsdayMode } from '../utils/theme-state.js';
import { doomsdayStatusIcons } from '../../assets/art/doomsday.js';

const DEFAULT_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#d946ef',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  dim: '#71717a',
  muted: '#52525b',
};

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

// Gradient uses theme primary/secondary by default
const baseGradient = gradient([themeColors.primary, themeColors.accent || themeColors.secondary]);

// Export a function that applies the gradient multiline (top to bottom)
export const ultraGradient = (str) => baseGradient.multiline(str);

export const theme = {
  primary: chalk.hex(themeColors.primary),
  secondary: chalk.hex(themeColors.secondary),
  accent: chalk.hex(themeColors.accent),
  success: chalk.hex(themeColors.success),
  error: chalk.hex(themeColors.error),
  warning: chalk.hex(themeColors.warning),
  info: chalk.hex(themeColors.secondary),
  title: chalk.hex(themeColors.primary).bold,
  subtitle: chalk.hex(themeColors.secondary),
  dim: chalk.hex(themeColors.dim),
  muted: chalk.hex(themeColors.muted),
  highlight: chalk.hex(themeColors.primary).inverse,
  link: chalk.hex(themeColors.secondary).underline,
  code: chalk.hex(themeColors.accent),
};

export function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function box(content, title = '') {
  const width = 60;
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

export function divider(char = '─', width = 60) {
  return theme.dim(char.repeat(width));
}

export function header(text) {
  console.log('');
  console.log(theme.title(`  ${text}`));
  console.log(theme.primary('  ' + '─'.repeat(56)));
}

export function subheader(text) {
  console.log(theme.subtitle(`  ${text}`));
}

export const status = {
  success: theme.success(isDoomsdayMode() ? doomsdayStatusIcons.success : '✓'),
  error: theme.error(isDoomsdayMode() ? doomsdayStatusIcons.error : '✖'),
  warning: theme.warning(isDoomsdayMode() ? doomsdayStatusIcons.warning : '⚠'),
  info: theme.secondary(isDoomsdayMode() ? doomsdayStatusIcons.info : 'ℹ'),
  pending: theme.dim(isDoomsdayMode() ? doomsdayStatusIcons.pending : '○'),
  running: theme.accent(isDoomsdayMode() ? doomsdayStatusIcons.running : '⟳'),
  arrow: theme.primary('→'),
  bullet: theme.dim('•'),
};

export function statusLine(icon, text, detail = '') {
  const detailText = detail ? theme.dim(` · ${detail}`) : '';
  console.log(`  ${icon} ${text}${detailText}`);
}

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
