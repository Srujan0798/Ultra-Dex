// Copyright (c) 2026 Ultra-Dex

/**
 * Voice Command for Ultra-Dex CLI
 */

import { routeIntent, extractParams, getIntentConfidence } from '../nlp/router.js';
import { handleVoiceCommand, checkVoicePrerequisites, voiceToText } from './whisper.js';

export async function voiceCommand(options = {}) {
  // Check prerequisites
  const prereqs = checkVoicePrerequisites();

  if (!prereqs.ready) {
    console.log('❌ Voice input not available\n');
    console.log(prereqs.installInstructions);
    return null;
  }

  console.log('🎤 Ultra-Dex Voice Mode\n');

  if (options.continuous) {
    console.log('Continuous listening mode (Ctrl+C to exit)\n');

    while (true) {
      try {
        const result = await handleVoiceCommand(routeIntent, options);

        if (result && result.intent) {
          console.log(`\nExecuting: ${result.intent}`);
          // Return the intent for the main CLI to handle
          return result;
        }
      } catch (err) {
        if (err.message.includes('SIGINT')) {
          console.log('\n👋 Exiting voice mode');
          break;
        }
        console.error(`Error: ${err.message}`);
      }
    }
  } else {
    // Single command mode
    const result = await handleVoiceCommand(routeIntent, {
      duration: options.duration || 5,
      ...options,
    });

    if (result) {
      const { intent, confidence } = getIntentConfidence(result.text);
      console.log(`\nConfidence: ${Math.round(confidence * 100)}%`);

      if (intent) {
        const params = extractParams(intent, result.text);
        return { ...result, params };
      }
    }

    return result;
  }
}

export default voiceCommand;
