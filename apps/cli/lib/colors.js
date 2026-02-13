import chalk from 'chalk';
import gradient from 'gradient-string';

/**
 * Professional Gradient Presets for Ultra-Dex
 */
export const gradients = {
  brand: gradient(['#6e40aa', '#963db3', '#bf38af', '#e731a1', '#ff3383']),
  success: gradient(['#00b09b', '#96c93d']),
  error: gradient(['#ff5f6d', '#ffc371']),
  warning: gradient(['#f12711', '#f5af19']),
  info: gradient(['#00c6ff', '#0072ff']),
  cosmic: gradient(['#24c6dc', '#514a9d']),
  rainbow: gradient.rainbow,
  passion: gradient(['#f2709c', '#ff9472']),
};

/**
 * Consistent color scheme for Ultra-Dex CLI
 */
export const colors = {
  // Brand colors
  primary: chalk.blue,
  secondary: chalk.cyan,
  accent: chalk.magenta,
  
  // Status colors
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  
  // Text variants
  highlight: chalk.bold,
  subtle: chalk.gray,
  emphasis: chalk.italic,
  
  // Combined utilities
  status: {
    success: (text) => chalk.green('✓ ') + text,
    error: (text) => chalk.red('✗ ') + text,
    warning: (text) => chalk.yellow('⚠ ') + text,
    info: (text) => chalk.blue('ℹ ') + text,
    pending: (text) => chalk.yellow('○ ') + text,
  },
  
  // Brand combinations
  brand: (text) => gradients.brand.bold(text),
  command: (text) => chalk.cyan.bold(`ultra-dex ${text}`),
  highlightBrand: (text) => chalk.bgHex('#6e40aa').white.bold(text),
  celebrate: (text) => gradients.rainbow.bold(text),
};

/**
 * Applies consistent formatting to a message
 * @param {string} type - Type of message ('success', 'error', 'warning', 'info')
 * @param {string} message - Message to format
 * @returns {string} Formatted message
 */
export function formatMessage(type, message) {
  switch (type) {
    case 'success':
      return colors.status.success(message);
    case 'error':
      return colors.status.error(message);
    case 'warning':
      return colors.status.warning(message);
    case 'info':
      return colors.status.info(message);
    default:
      return message;
  }
}

/**
 * Formats a title with consistent styling
 * @param {string} title - Title text
 * @returns {string} Formatted title
 */
export function formatTitle(title) {
  const line = '━'.repeat(title.length + 4);
  return `\n${gradients.brand(line)}\n  ${colors.highlight(colors.brand(title))}\n${gradients.brand(line)}\n`;
}

/**
 * Formats a section header
 * @param {string} header - Section header text
 * @returns {string} Formatted header
 */
export function formatSection(header) {
  return `\n${colors.accent.bold('◈')} ${chalk.bold(header)} ${colors.accent.bold('◈')}\n`;
}

/**
 * Formats a list item
 * @param {string} item - List item text
 * @param {number} index - Index for numbering
 * @returns {string} Formatted list item
 */
export function formatListItem(item, index = null) {
  const prefix = index !== null ? `${index + 1}. ` : '▸ ';
  return `${colors.secondary(prefix)}${item}`;
}