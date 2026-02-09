// Copyright (c) 2026 Ultra-Dex
// Voice Command Handler
// Orchestrates recording, transcription, and intent routing

import { audioRecorder } from './recorder.js';
import { whisperService } from './whisper.js';
import { routeIntent, extractParams, getIntentConfidence } from '../nlp/router.js';
import { execSync } from 'child_process';
import fs from 'fs';

function checkPrerequisites() {
  const missing = [];

  // Check for SoX or Rec (Linux/Mac)
  try {
    execSync('rec --version', { stdio: 'ignore' });
  } catch (e) {
    try {
      execSync('sox --version', { stdio: 'ignore' });
    } catch (e2) {
      missing.push('sox (or rec)');
    }
  }

  // Check for API Key
  if (!whisperService.isReady()) {
    missing.push('OPENAI_API_KEY environment variable');
  }

  return {
    ready: missing.length === 0,
    missing,
    installInstructions: missing.length > 0 ?
      `Missing prerequisites:\n${missing.map(m => `- ${m}`).join('\n')}\n\nTo install SoX:\n  macOS: brew install sox\n  Linux: sudo apt install sox` : null
  };
}

export async function voiceCommand(options = {}) {
  const prereqs = checkPrerequisites();

  if (!prereqs.ready) {
    console.log('❌ Voice input not available');
    console.log(prereqs.installInstructions);
    return null;
  }

  console.log('🎤 Ultra-Dex Voice Mode');
  console.log('   Speak your command (e.g., "Create a new Next.js project")');
  console.log('   Press Ctrl+C to stop recording if not auto-detected.\n');

  try {
    // Start recording
    const audioPath = audioRecorder.start();

    // Wait for silence or manual stop (simulated by duration for now if not stream)
    // node-record-lpcm16 handles silence stop if configured

    // For the CLI command, we might want to wait for the 'end' event from recorder
    // But recorder.start returns the path immediately.
    // We need to wait for the stream to end.

    await new Promise((resolve, reject) => {
      audioRecorder.on('end', resolve);
      audioRecorder.on('error', reject);

      // Safety timeout
      if (options.duration) {
        setTimeout(() => audioRecorder.stop(), options.duration * 1000);
      }

      // Handle Ctrl+C to stop recording gracefully
      process.on('SIGINT', () => {
        audioRecorder.stop();
        console.log('\n🛑 Stopping recording...');
      });
    });

    console.log('🔄 Transcribing...');
    const text = await whisperService.transcribe(audioPath);
    console.log(`📝 Heard: "${text}"`);

    // Clean up temp file
    fs.unlinkSync(audioPath);

    if (!text || text.trim().length === 0) {
      console.log('❌ No speech detected');
      return null;
    }

    // NLP Routing
    const { intent, confidence } = getIntentConfidence(text);
    console.log(`🎯 Intent: ${intent} (${Math.round(confidence * 100)}%)`);

    if (intent) {
      const params = extractParams(intent, text);
      return { text, intent, params, confidence };
    }

    return { text, intent: null };

  } catch (error) {
    console.error(`🔇 Voice error: ${error.message}`);
    return null;
  }
}

export default voiceCommand;
