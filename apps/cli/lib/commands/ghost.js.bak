// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ghost module
 * @module commands/ghost
 */
// Project Ghost CLI Command

import { ghostAgent } from '../ghost/agent.js';

export function registerGhostCommand(program) {
    program
        .command('ghost')
        .description('Autonomous Computer Use Agent (Project Ghost)')
        .argument('<goal>', 'Goal for the agent (e.g., "Check emails")')
        .option('--unsafe', 'Disable user confirmation (DANGEROUS)', false)
        .option('--debug', 'Show distinct debug info', false)
        .action(async (goal, options) => {
            logger.log('👻 Initializing Ghost Agent...');

            // Configure agent
            ghostAgent.safetyMode = !options.unsafe;
            ghostAgent.debug = options.debug;

            await ghostAgent.run(goal);
        });
}

export default registerGhostCommand;

/**
 * Safe execution wrapper with error handling for ghost
 * @param {Function} fn - Async function to execute
 * @param {string} [context='ghost'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'ghost') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
