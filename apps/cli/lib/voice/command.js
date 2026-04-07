// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Command module
 * @module voice/command
 */
// Voice Command Handler
// Orchestrates recording, transcription, and intent routing

import { audioRecorder } from './recorder.js';
import { whisperService } from './whisper.js';
import { extractParams, getIntentConfidence } from '../nlp/router.js';
import { execSync } from 'child_process';
import fs from 'fs';

function checkPrerequisites() {
  const missing = [];

  // Check for SoX or Rec (Linux/Mac)
  try {
    execSync('rec --version', { stdio: 'ignore' });
  } catch (_e) {
    try {
      execSync('sox --version', { stdio: 'ignore' });
    } catch (_e2) {
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

async function recordOnce(options = {}) {
  const audioPath = audioRecorder.start();

  const stopRecording = () => {
    audioRecorder.stop();
    console.log('\n🛑 Stopping recording...');
  };

  await new Promise((resolve, reject) => {
    audioRecorder.once('end', resolve);
    audioRecorder.once('error', reject);

    if (options.duration) {
      setTimeout(() => audioRecorder.stop(), options.duration * 1000);
    }

    process.once('SIGINT', stopRecording);
  });

  console.log('🔄 Transcribing...');
  const text = await whisperService.transcribe(audioPath);
  console.log(`📝 Heard: "${text}"`);

  fs.unlinkSync(audioPath);

  if (!text || text.trim().length === 0) {
    console.log('❌ No speech detected');
    return null;
  }

  const { intent, confidence } = getIntentConfidence(text);
  console.log(`🎯 Intent: ${intent} (${Math.round(confidence * 100)}%)`);

  if (intent) {
    const params = extractParams(intent, text);
    return { text, intent, params, confidence };
  }

  return { text, intent: null };
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
    if (!options.continuous) {
      return await recordOnce(options);
    }

    const rounds = Number.isFinite(options.rounds) ? options.rounds : 3;
    const results = [];

    for (let i = 0; i < rounds; i += 1) {
      console.log(`\n🔁 Listening round ${i + 1}/${rounds}`);
      const result = await recordOnce(options);
      if (result) {
        results.push(result);
        if (result.intent === 'exit') {
          break;
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`🔇 Voice error: ${error.message}`);
    return null;
  }
}

export default voiceCommand;
