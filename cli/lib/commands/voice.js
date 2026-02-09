// Copyright (c) 2026 Ultra-Dex
// Voice Command Entry Point

import { voiceCommand } from '../voice/index.js';

export function registerVoiceCommand(program) {
  program
    .command('voice')
    .description('Control Ultra-Dex with voice commands (Project Siren)')
    .option('-d, --duration <seconds>', 'Recording duration in seconds', 5)
    // .option('-c, --continuous', 'Continuous listening mode', false) // Future
    .action(async (options) => {
      await voiceCommand({
        duration: parseInt(options.duration, 10),
        ...options
      });
    });
}

export default registerVoiceCommand;