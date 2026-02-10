// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Voice module
 * @module commands/voice
 */
// Voice Command Entry Point

import { voiceCommand } from '../voice/index.js';

export function registerVoiceCommand(program) {
  program
    .command('voice')
    .description('Control Ultra-Dex with voice commands (Project Siren)')
    .option('-d, --duration <seconds>', 'Recording duration in seconds', 5)
    .option('-c, --continuous', 'Continuous listening mode', false)
    .option('-r, --rounds <count>', 'Max rounds in continuous mode', 3)
    .action(async (options) => {
      await voiceCommand({
        duration: parseInt(options.duration, 10),
        continuous: !!options.continuous,
        rounds: parseInt(options.rounds, 10),
        ...options
      });
    });
}

export default registerVoiceCommand;

/**
 * Safe execution wrapper with error handling for voice
 * @param {Function} fn - Async function to execute
 * @param {string} [context='voice'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'voice') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
