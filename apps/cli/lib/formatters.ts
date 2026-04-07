import chalk from 'chalk';
import { stripIndent } from 'common-tags';

/**
 * Formatting utilities for Ultra-Dex CLI
 */

/**
 * Create a styled table with consistent formatting
 * @param {Array<string>} headers - Column headers
 * @param {Array<Array<string>>} rows - Table rows
 * @param {object} options - Table options
 * @returns {string} Formatted table
 */
export async function createTable(headers, rows, options = {}) {
  const { default: Table } = await import('cli-table3');
  const table = new Table({
    head: headers.map(h => chalk.bold.blue(h)),
    colWidths: options.colWidths || headers.map(() => 20),
    style: {
      head: ['bold', 'blue'],
      border: ['gray'],
      compact: options.compact || false
    },
    ...options
  });

  rows.forEach(row => {
    table.push(row);
  });

  return table.toString();
}

/**
 * Create a summary card with consistent styling
 * @param {string} title - Card title
 * @param {Array<{key: string, value: string}>} items - Key-value pairs to display
 * @returns {string} Formatted summary card
 */
export function createSummaryCard(title, items) {
  const maxLength = Math.max(...items.map(item => item.key.length));
  const paddedItems = items.map(item => ({
    key: item.key.padEnd(maxLength),
    value: item.value
  }));

  let output = `\n${chalk.bold.blue('┌─')} ${chalk.bold.white(title)} ${chalk.bold.blue('─┐')}\n`;

  paddedItems.forEach(item => {
    output += chalk.blue('│ ') + chalk.bold(item.key) + chalk.gray(' : ') + chalk.white(item.value) + chalk.blue(' │\n');
  });

  output += chalk.blue('└' + '─'.repeat(title.length + 4 + maxLength) + '┘\n');

  return output;
}

/**
 * Create a status panel with consistent styling
 * @param {Array<{status: string, message: string, details?: string}>} items - Status items
 * @returns {string} Formatted status panel
 */
export function createStatusPanel(items) {
  let output = '';
  
  items.forEach((item, index) => {
    let statusIcon = '';
    let statusColor = chalk.gray;
    
    switch (item.status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'ok':
        statusIcon = '✅';
        statusColor = chalk.green;
        break;
      case 'error':
      case 'failed':
        statusIcon = '❌';
        statusColor = chalk.red;
        break;
      case 'warning':
      case 'warn':
        statusIcon = '⚠️';
        statusColor = chalk.yellow;
        break;
      case 'pending':
      case 'waiting':
        statusIcon = '⏳';
        statusColor = chalk.yellow;
        break;
      case 'running':
      case 'active':
        statusIcon = '🏃';
        statusColor = chalk.blue;
        break;
      default:
        statusIcon = 'ℹ️';
        statusColor = chalk.blue;
    }
    
    output += `${statusColor(statusIcon)} ${chalk.bold(item.message)}\n`;
    
    if (item.details) {
      output += `   ${chalk.gray(stripIndent(item.details))}\n`;
    }
    
    if (index < items.length - 1) {
      output += '\n';
    }
  });
  
  return output;
}

/**
 * Create a progress visualization
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {string} label - Label for the progress
 * @param {object} options - Options for the progress bar
 * @returns {string} Formatted progress bar
 */
export function createProgressBar(current, total, label = '', options = {}) {
  const width = options.width || 30;
  const filledChar = options.filledChar || '█';
  const emptyChar = options.emptyChar || '░';
  const percentage = Math.round((current / total) * 100);
  
  const filledLength = Math.round((current / total) * width);
  const emptyLength = width - filledLength;
  
  const progressBar = chalk.green(filledChar.repeat(filledLength)) + 
                     chalk.gray(emptyChar.repeat(emptyLength));
  
  const progressText = chalk.bold(`${current}/${total} (${percentage}%)`);
  
  if (label) {
    return `${chalk.blue(label)}\n[${progressBar}] ${progressText}`;
  }
  
  return `[${progressBar}] ${progressText}`;
}

/**
 * Format a list with consistent styling
 * @param {Array<string>} items - List items
 * @param {object} options - Options for the list
 * @returns {string} Formatted list
 */
export function createList(items, options = {}) {
  const style = options.style || 'bullet'; // 'bullet', 'numbered', 'arrow'
  let output = '';
  
  items.forEach((item, index) => {
    let prefix = '';
    
    switch (style) {
      case 'numbered':
        prefix = chalk.blue(`${index + 1}. `);
        break;
      case 'arrow':
        prefix = chalk.yellow('➤ ');
        break;
      case 'bullet':
      default:
        prefix = chalk.green('• ');
    }
    
    output += `${prefix}${item}\n`;
  });
  
  return output;
}

/**
 * Create a code block with syntax highlighting
 * @param {string} code - Code to format
 * @param {string} language - Language for syntax highlighting
 * @returns {string} Formatted code block
 */
export function createCodeBlock(code, language = '') {
  let output = chalk.gray('┌─ ') + chalk.bold.blue(language) + '\n';
  output += chalk.gray('│ ') + code.split('\n').join('\n' + chalk.gray('│ ')) + '\n';
  output += chalk.gray('└' + '─'.repeat(Math.max(20, code.split('\n')[0]?.length || 20)));
  
  return output;
}

/**
 * Create a notification message with consistent styling
 * @param {string} type - Type of notification ('info', 'success', 'warning', 'error')
 * @param {string} message - Notification message
 * @param {string} details - Optional details
 * @returns {string} Formatted notification
 */
export function createNotification(type, message, details = '') {
  let icon = 'ℹ️';
  let color = chalk.blue;
  
  switch (type.toLowerCase()) {
    case 'success':
      icon = '✅';
      color = chalk.green;
      break;
    case 'warning':
      icon = '⚠️';
      color = chalk.yellow;
      break;
    case 'error':
      icon = '❌';
      color = chalk.red;
      break;
    case 'info':
    default:
      icon = 'ℹ️';
      color = chalk.blue;
  }
  
  let output = color(icon) + ' ' + chalk.bold(message) + '\n';
  
  if (details) {
    output += chalk.gray(stripIndent(details)) + '\n';
  }
  
  return output;
}

/**
 * Format a key-value pair with consistent styling
 * @param {string} key - Key
 * @param {string} value - Value
 * @param {object} options - Options for formatting
 * @returns {string} Formatted key-value pair
 */
export function formatKeyValue(key, value, options = {}) {
  const separator = options.separator || ': ';
  const keyStyle = options.keyStyle || chalk.bold.blue;
  const valueStyle = options.valueStyle || chalk.white;
  
  return keyStyle(key) + chalk.gray(separator) + valueStyle(value);
}

/**
 * Create a divider with consistent styling
 * @param {string} text - Optional text to center in the divider
 * @param {number} width - Width of the divider
 * @returns {string} Formatted divider
 */
export function createDivider(text = '', width = 60) {
  if (text) {
    const padding = Math.floor((width - text.length) / 2);
    const leftPadding = '='.repeat(padding);
    const rightPadding = '='.repeat(width - padding - text.length);
    return chalk.gray(`${leftPadding} ${chalk.bold(text)} ${rightPadding}`);
  } else {
    return chalk.gray('='.repeat(width));
  }
}

/**
 * Format a timestamp with consistent styling
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return chalk.gray(date.toLocaleString());
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Human readable format
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human readable format
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Create a styled box around content
 * @param {string} content - Content to wrap
 * @param {string} title - Optional title for the box
 * @returns {string} Styled box
 */
export function createBox(content, title = '') {
  const lines = content.split('\n');
  const maxWidth = Math.max(...lines.map(line => line.length), title.length);
  
  let output = '';
  
  if (title) {
    output += chalk.blue('┌─ ') + chalk.bold(title) + chalk.blue(' ' + '─'.repeat(maxWidth - title.length)) + '┐\n';
  } else {
    output += chalk.blue('┌' + '─'.repeat(maxWidth + 2) + '┐\n');
  }
  
  lines.forEach(line => {
    output += chalk.blue('│ ') + line.padEnd(maxWidth) + chalk.blue(' │\n');
  });
  
  output += chalk.blue('└' + '─'.repeat(maxWidth + 2) + '┘');
  
  return output;
}

// Export all formatters
export default {
  createTable,
  createSummaryCard,
  createStatusPanel,
  createProgressBar,
  createList,
  createCodeBlock,
  createNotification,
  formatKeyValue,
  createDivider,
  formatTimestamp,
  formatBytes,
  formatDuration,
  createBox
};