import chalk from 'chalk';

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
  brand: (text) => chalk.bold.hex('#6e40aa')(text), // Ultra-Dex purple
  command: (text) => chalk.cyan.bold(`ultra-dex ${text}`),
  highlightBrand: (text) => chalk.bgHex('#6e40aa').white.bold(text),
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
  return `\n${colors.highlight(colors.brand(title))}\n${'─'.repeat(title.length + 2)}\n`;
}

/**
 * Formats a section header
 * @param {string} header - Section header text
 * @returns {string} Formatted header
 */
export function formatSection(header) {
  return `\n${colors.accent.bold('┌─')} ${header} ${colors.accent.bold('─┐')}\n`;
}

/**
 * Formats a list item
 * @param {string} item - List item text
 * @param {number} index - Index for numbering
 * @returns {string} Formatted list item
 */
export function formatListItem(item, index = null) {
  const prefix = index !== null ? `${index + 1}. ` : '• ';
  return `${colors.subtle(prefix)}${item}`;
}