// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Compare module
 * @module commands/compare
 */

import chalk from 'chalk';
import { printInfo, printWarning } from '../utils/output.js';

const COMPETITORS = {
  devin: {
    gap: 'No live boilerplate',
    counter: '--live mode with full SaaS templates',
  },
  cursor: {
    gap: 'Missing rules',
    counter: '31+ .mdc rules + MCP context',
  },
  replit: {
    gap: 'CLI too static',
    counter: 'Voice + auto-sync + swarm',
  },
  'claude-code': {
    gap: 'Amnesia',
    counter: 'CONTEXT.md + memex + session memory',
  },
};

export function registerCompareCommand(program) {
  program
    .command('compare [tool]')
    .description('Compare Ultra-Dex against competitors')
    .option('--all', 'Show all competitors')
    .action((tool, options) => {
      const keys = options.all ? Object.keys(COMPETITORS) : [tool].filter(Boolean);
      if (!keys.length) {
        printWarning('Provide a competitor name or use --all');
        return;
      }

      keys.forEach((key) => {
        const competitor = COMPETITORS[key];
        if (!competitor) {
          printWarning(`Unknown competitor: ${key}`);
          return;
        }
        printInfo(
          chalk.cyan(`
${key.toUpperCase()}`)
        );
        printInfo(`Gap: ${competitor.gap}`);
        printInfo(`Ultra-Dex Counter: ${competitor.counter}`);
      });
    });
}

/**
 * Handle errors in compare module
 * @param {Error} error - The error to handle
 * @param {string} [context='compare'] - Error context
 */
function handleModuleError(error, context = 'compare') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
