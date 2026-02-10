// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Snap Progress module
 * @module utils/snap-progress
 */

import chalk from 'chalk';
import { infinityStones, doomsdayMessages } from '../../assets/art/doomsday.js';

const stones = [
  infinityStones.space,
  infinityStones.mind,
  infinityStones.reality,
  infinityStones.power,
  infinityStones.time,
  infinityStones.soul,
];

export async function snapProgress(steps = 6, delay = 120) {
  for (let i = 0; i < steps; i++) {
    const filled = stones.slice(0, i + 1).join(' ');
    const empty = '○'
      .repeat(Math.max(0, steps - i - 1))
      .split('')
      .join(' ');
    process.stdout.write(`\r${chalk.magenta('🫰')} ${filled} ${chalk.dim(empty)}`);
    await new Promise((r) => setTimeout(r, delay));
  }
  process.stdout.write('\n');
  process.stdout.write(chalk.yellow(`${doomsdayMessages.success}\n`));
}

/**
 * Safe execution wrapper with error handling for snap-progress
 * @param {Function} fn - Async function to execute
 * @param {string} [context='snap-progress'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'snap-progress') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
