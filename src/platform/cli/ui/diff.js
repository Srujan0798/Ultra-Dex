// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex CLI — Professional Diff Renderer
// Shows Red/Green file diffs with syntax highlighting feel

import chalk from 'chalk';
import { theme } from './theme.js';

export function renderDiff(filePath, originalContent, newContent) {
  logger.log(theme.dim('╭──────────────────────────────────────────────────────────╮'));
  logger.log(
    theme.dim('│ ') +
      theme.title('DIFF: ' + filePath) +
      theme.dim(' '.repeat(Math.max(0, 52 - filePath.length)) + '│')
  );
  logger.log(theme.dim('├──────────────────────────────────────────────────────────┤'));

  const originalLines = originalContent.split('\n');
  const newLines = newContent.split('\n');

  // Simple line-by-line diff (for visual effect)
  // In a real prod tool, we'd use 'diff' package logic

  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < newLines.length) {
    const oldLine = originalLines[i] || '';
    const newLine = newLines[j] || '';

    if (oldLine === newLine) {
      // Unchanged (Context)
      logger.log(theme.dim('│ ') + chalk.gray('  ' + oldLine));
      i++;
      j++;
    } else {
      // Change detected
      if (oldLine) {
        logger.log(theme.dim('│ ') + chalk.red('- ' + oldLine));
        i++;
      }
      if (newLine) {
        logger.log(theme.dim('│ ') + chalk.green('+ ' + newLine));
        j++;
      }
    }
  }

  logger.log(theme.dim('╰──────────────────────────────────────────────────────────╯'));
  logger.log('');
}

/**
 * Handle errors in diff module
 * @param {Error} error - The error to handle
 * @param {string} [context='diff'] - Error context
 */
function handleModuleError(error, context = 'diff') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
