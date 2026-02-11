// Copyright (c) 2026 Ultra-Dex

import { audioRecorder } from './recorder.js';
import { whisperService } from './whisper.js';
import { voiceCommand } from './command.js';

export {
    audioRecorder,
    whisperService,
    voiceCommand
};

export default {
    audioRecorder,
    whisperService,
    voiceCommand
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
