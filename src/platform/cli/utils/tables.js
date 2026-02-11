// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Tables module
 * @module utils/tables
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import gradient from 'gradient-string';

// Different table styles for various use cases
const TABLE_STYLES = {
  DEFAULT: {
    head: ['magenta'],
    border: ['dim'],
  },
  HIGHLIGHT: {
    head: ['bold', 'bgMagenta', 'white'],
    border: ['dim'],
    'padding-left': 1,
    'padding-right': 1,
  },
  MINIMAL: {
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: ' ',
      'left-mid': ' ',
      mid: '',
      'mid-mid': '',
      right: ' ',
      'right-mid': ' ',
      middle: ' ',
    },
    style: {
      head: ['bold', 'cyan'],
      border: ['dim'],
    },
  },
  BORDERED: {
    chars: {
      top: '═',
      'top-mid': '╤',
      'top-left': '╔',
      'top-right': '╗',
      bottom: '═',
      'bottom-mid': '╧',
      'bottom-left': '╚',
      'bottom-right': '╝',
      left: '║',
      'left-mid': '╟',
      mid: '─',
      'mid-mid': '┼',
      right: '║',
      'right-mid': '╢',
      middle: '│',
    },
    style: {
      head: ['bold', 'bgBlue', 'white'],
      border: ['dim'],
    },
  },
};

export function createTable(headers, rows, style = 'DEFAULT') {
  const styleOptions = TABLE_STYLES[style] || TABLE_STYLES.DEFAULT;

  const table = new Table({
    head: headers.map((h) => gradient(['#6366f1', '#8b5cf6'])(h)),
    ...(styleOptions.chars ? { chars: styleOptions.chars } : {}),
    style: styleOptions,
  });

  rows.forEach((row) => {
    // Apply styling to each cell
    const styledRow = row.map((cell) => {
      if (typeof cell === 'string') {
        // Apply different styling based on content
        if (cell.match(/^(?:success|ready|active|online|✓|✔|●)$/i)) {
          return chalk.greenBright(cell);
        } else if (cell.match(/^(?:error|failed|inactive|offline|✗|✘|○)$/i)) {
          return chalk.redBright(cell);
        } else if (cell.match(/^\d+$/)) {
          return chalk.yellowBright(cell);
        } else if (cell.startsWith('https://') || cell.startsWith('http://')) {
          return chalk.blue.underline(cell);
        }
      }
      return cell;
    });
    table.push(styledRow);
  });

  return table.toString();
}

export function createStyledTable(headers, rows, options = {}) {
  const { style = 'DEFAULT', colWidths = null, wordWrap = true, truncate = false } = options;

  const styleOptions = TABLE_STYLES[style] || TABLE_STYLES.DEFAULT;

  const tableOptions = {
    head: headers.map((h) => gradient(['#6366f1', '#8b5cf6'])(h)),
    ...(colWidths ? { colWidths } : {}),
    ...(wordWrap ? {} : { wordWrap: false }),
    ...(truncate ? { truncate: truncate } : {}),
    ...(styleOptions.chars ? { chars: styleOptions.chars } : {}),
    style: styleOptions,
  };

  const table = new Table(tableOptions);

  rows.forEach((row) => {
    const styledRow = row.map((cell) => {
      if (typeof cell === 'string') {
        if (cell.match(/^(?:success|ready|active|online|✓|✔|●)$/i)) {
          return chalk.greenBright(cell);
        } else if (cell.match(/^(?:error|failed|inactive|offline|✗|✘|○)$/i)) {
          return chalk.redBright(cell);
        } else if (cell.match(/^\d+$/)) {
          return chalk.yellowBright(cell);
        } else if (cell.startsWith('https://') || cell.startsWith('http://')) {
          return chalk.blue.underline(cell);
        }
      }
      return cell;
    });
    table.push(styledRow);
  });

  return table.toString();
}

export function showAgentsTable(agents) {
  const headers = ['Tier', 'Agent', 'Status', 'Capabilities'];
  const rows = agents.map((a) => [
    chalk.dim(a.tier || 'N/A'),
    chalk.cyan.bold(a.name),
    a.status === 'ready' ? chalk.greenBright('● READY') : chalk.yellowBright('○ PENDING'),
    chalk.gray(Array.isArray(a.capabilities) ? a.capabilities.slice(0, 2).join(', ') : 'N/A'),
  ]);
  console.log(createStyledTable(headers, rows, { style: 'HIGHLIGHT' }));
}

export function showCommandsTable(commands) {
  const headers = ['Command', 'Description', 'Category'];
  const rows = commands.map((c) => [
    chalk.cyan.bold(c.name),
    chalk.dim(c.description),
    chalk.magenta(c.category || 'General'),
  ]);
  console.log(createStyledTable(headers, rows, { style: 'MINIMAL' }));
}

export function showStatusTable(statusData) {
  const headers = ['Component', 'Status', 'Details'];
  const rows = Object.entries(statusData).map(([component, data]) => [
    chalk.bold(component),
    data.status === 'healthy' ? chalk.greenBright('● HEALTHY') : chalk.redBright('■ ERROR'),
    chalk.dim(data.details || 'N/A'),
  ]);
  console.log(createStyledTable(headers, rows, { style: 'BORDERED' }));
}

export function showDataTable(data, title = 'Data Table') {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No data to display'));
    return;
  }

  // Get headers from the first object's keys
  const headers = Object.keys(data[0]).map((header) =>
    gradient(['#ec4899', '#8b5cf6'])(header.toUpperCase())
  );

  const rows = data.map((item) => Object.values(item).map((value) => String(value)));

  console.log(chalk.bold.magenta(`\n📊 ${title}\n`));
  console.log(
    createStyledTable(headers, rows, {
      style: 'BORDERED',
      colWidths: headers.map(() => 20), // Adjust column widths as needed
    })
  );
}

/**
 * Handle errors in tables module
 * @param {Error} error - The error to handle
 * @param {string} [context='tables'] - Error context
 */
function handleModuleError(error, context = 'tables') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
