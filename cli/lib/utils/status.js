// Copyright (c) 2026 Ultra-Dex

/**
 * Status Icons and Indicators for Ultra-Dex CLI
 * Provides consistent visual status indicators across all commands
 */

import chalk from 'chalk';
import figures from 'figures';

// Maintain backward compatibility with original exports
export const icons = {
  success: chalk.hex('#22c55e')(figures.tick),
  error: chalk.hex('#ef4444')(figures.cross),
  warning: chalk.hex('#f59e0b')(figures.warning),
  info: chalk.hex('#6366f1')(figures.info),
  pending: chalk.hex('#6b7280')(figures.circle),
  running: chalk.hex('#d946ef')(figures.play),
  pointer: chalk.hex('#8b5cf6')(figures.pointer),
  bullet: chalk.dim(figures.bullet),
};

export function showInfinityStatus() {
  // Deprecated function, kept for compatibility if called elsewhere but showing nothing or simple status
}

export function statusLine(icon, text) {
  console.log(`  ${icon} ${text}`);
}

export function header(text) {
  console.log('');
  console.log(chalk.bold.hex('#8b5cf6')(`  ${text}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

export function separator() {
  console.log('');
}

// Enhanced status utilities (new additions)
// Status icons mapping
const STATUS_ICONS = {
  success: figures.tick,
  error: figures.cross,
  warning: figures.warning,
  info: figures.info,
  loading: figures.play,
  pause: figures.squareSmallFilled,
  stop: figures.square,
  check: figures.checkboxOn,
  unchecked: figures.checkboxOff,
  radioOn: figures.radioOn,
  radioOff: figures.radioOff,
  pointer: figures.pointer,
  arrowLeft: figures.arrowLeft,
  arrowRight: figures.arrowRight,
  arrowUp: figures.arrowUp,
  arrowDown: figures.arrowDown,
  heart: figures.heart,
  star: figures.star,
  circle: figures.circle,
  bullet: figures.bullet,
  dot: figures.dot,
  line: figures.line,
  ellipsis: figures.ellipsis,
  home: figures.home,
  laptop: figures.laptop,
  mobile: figures.mobile,
  gear: figures.gear,
  bell: figures.bell,
  lock: figures.lock,
  unlock: figures.lockOpen,
  eye: figures.eye,
  eyeHidden: figures.eyeHidden,
  key: figures.key,
  mail: figures.mail,
  link: figures.link,
  cross: figures.cross,
  tick: figures.tick,
  checkboxOn: figures.checkboxOn,
  checkboxOff: figures.checkboxOff,
  radioOn: figures.radioOn,
  radioOff: figures.radioOff,
  pointer: figures.pointer,
  pointerSmall: figures.pointerSmall,
  play: figures.play,
  triangleUp: figures.triangleUp,
  triangleLeft: figures.triangleLeft,
  triangleRight: figures.triangleRight,
  triangleDown: figures.triangleDown,
  lozenge: figures.lozenge,
  lozengeOutline: figures.lozengeOutline,
  diamond: figures.diamond,
  diamondOutline: figures.diamondOutline,
  ballotCross: figures.ballotCross,
  ballotX: figures.ballotX,
  ballotChecked: figures.ballotChecked,
  one: figures.one,
  two: figures.two,
  three: figures.three,
  four: figures.four,
  five: figures.five,
  six: figures.six,
  seven: figures.seven,
  eight: figures.eight,
  nine: figures.nine,
  copyright: figures.copyright,
  registered: figures.registered,
  trademark: figures.trademark,
  paragraph: figures.paragraph,
  pilcrow: figures.pilcrow,
  section: figures.section,
  masculineOrdinalIndicator: figures.masculineOrdinalIndicator,
  feminineOrdinalIndicator: figures.feminineOrdinalIndicator,
  degree: figures.degree,
  minus: figures.minus,
  plus: figures.plus,
  divide: figures.divide,
  multiplication: figures.multiplication,
  infinity: figures.infinity,
  superscriptOne: figures.superscriptOne,
  superscriptTwo: figures.superscriptTwo,
  superscriptThree: figures.superscriptThree,
  subscriptOne: figures.subscriptOne,
  subscriptTwo: figures.subscriptTwo,
  subscriptThree: figures.subscriptThree,
  blank: figures.space,
  space: figures.space,
  dotSmall: figures.dotSmall,
};

// Status colors mapping
const STATUS_COLORS = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  loading: 'cyan',
  neutral: 'white',
  muted: 'gray',
};

/**
 * Get status icon by type
 */
export function getStatusIcon(type = 'info') {
  return STATUS_ICONS[type] || STATUS_ICONS.info;
}

/**
 * Get status color by type
 */
export function getStatusColor(type = 'info') {
  return STATUS_COLORS[type] || 'white';
}

/**
 * Colorize text with status color
 */
export function colorize(text, type = 'info') {
  const color = getStatusColor(type);
  return chalk[color](text);
}

/**
 * Format status message with icon and color
 */
export function formatStatus(message, type = 'info') {
  const icon = getStatusIcon(type);
  const color = getStatusColor(type);
  return chalk[color](`${icon} ${message}`);
}

/**
 * Format success message
 */
export function formatSuccess(message) {
  return formatStatus(message, 'success');
}

/**
 * Format error message
 */
export function formatError(message) {
  return formatStatus(message, 'error');
}

/**
 * Format warning message
 */
export function formatWarning(message) {
  return formatStatus(message, 'warning');
}

/**
 * Format info message
 */
export function formatInfo(message) {
  return formatStatus(message, 'info');
}

/**
 * Format loading message
 */
export function formatLoading(message) {
  return formatStatus(message, 'loading');
}

/**
 * Format a progress indicator
 */
export function formatProgress(current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.floor((current / total) * 20);
  const empty = 20 - filled;

  const progressBar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const progressText = chalk.dim(`[${current}/${total}] ${percentage}%`);

  return `${progressBar} ${progressText} ${message}`;
}

/**
 * Format a status badge
 */
export function formatBadge(text, type = 'info', options = {}) {
  const { padding = 1, margin = 0, borderStyle = 'round', uppercase = false } = options;

  const displayText = uppercase ? text.toUpperCase() : text;
  const color = getStatusColor(type);

  return chalk[color].bold(` ${displayText} `);
}

/**
 * Format a status card with icon, title, and message
 */
export function formatStatusCard(title, message, type = 'info') {
  const icon = getStatusIcon(type);
  const color = getStatusColor(type);

  const card = [chalk.bold[color](`${icon} ${title}`), chalk[color](message), ''].join('\n');

  return card;
}

/**
 * Format a status table row
 */
export function formatStatusRow(icon, label, value, type = 'info') {
  const statusColor = getStatusColor(type);
  return `${chalk[statusColor](icon)} ${label.padEnd(20)} ${chalk.dim(value)}`;
}

/**
 * Format a status summary
 */
export function formatStatusSummary(items) {
  let output = '';

  items.forEach((item) => {
    const icon = getStatusIcon(item.type || 'info');
    const color = getStatusColor(item.type || 'info');
    output += `${chalk[color](icon)} ${item.label}: ${chalk.bold[item.type || 'white'](item.value)}\n`;
  });

  return output;
}

/**
 * Format a status timeline
 */
export function formatTimeline(events) {
  let output = '';

  events.forEach((event, index) => {
    const icon = index === events.length - 1 ? figures.pointer : figures.pointerSmall;
    const type = event.type || 'info';
    const color = getStatusColor(type);

    output += `${chalk[color](icon)} ${event.timestamp || ''} ${event.message}\n`;
  });

  return output;
}

/**
 * Format a status meter/bar
 */
export function formatMeter(current, max, options = {}) {
  const { width = 20, filledChar = '█', emptyChar = '░', showPercentage = true } = options;

  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const filled = Math.floor((current / max) * width);
  const empty = width - filled;

  const bar = chalk.green(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty));
  const display = showPercentage ? `${bar} ${percentage}%` : bar;

  return display;
}

/**
 * Format a status indicator with multiple states
 */
export function formatMultiStatus(statuses) {
  const statusStrings = statuses.map((status) => {
    const icon = getStatusIcon(status.type);
    const color = getStatusColor(status.type);
    return chalk[color](`${icon} ${status.label}`);
  });

  return statusStrings.join('  ');
}

export default {
  icons,
  showInfinityStatus,
  statusLine,
  header,
  separator,
  getStatusIcon,
  getStatusColor,
  colorize,
  formatStatus,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo,
  formatLoading,
  formatProgress,
  formatBadge,
  formatStatusCard,
  formatStatusRow,
  formatStatusSummary,
  formatTimeline,
  formatMeter,
  formatMultiStatus,
};

/**
 * Handle errors in status module
 * @param {Error} error - The error to handle
 * @param {string} [context='status'] - Error context
 */
function handleModuleError(error, context = 'status') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
