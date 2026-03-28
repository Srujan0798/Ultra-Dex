// Copyright (c) 2026 Ultra-Dex

/**
 * Voice Input Module for Ultra-Dex
 * Records audio from microphone and transcribes using OpenAI Whisper API
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import OpenAI from 'openai';
import { printError, printInfo, printSuccess } from '../utils/output.js';

/**
 * Record audio from microphone and transcribe using OpenAI Whisper
 * @param {Object} options - Options for recording and transcription
 * @param {number} options.duration - Recording duration in seconds (default: 30)
 * @param {string} options.format - Audio format (default: 'wav')
 * @returns {Promise<string>} - Transcribed text
 */
export async function recordAndTranscribe(options = {}) {
  const duration = options.duration || 30;
  const format = options.format || 'wav';

  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for voice transcription');
  }

  const openai = new OpenAI({ apiKey });

  printInfo('🎤 Starting voice recording...');

  // Create temporary file for audio recording
  const tempDir = os.tmpdir();
  const audioFilePath = path.join(tempDir, `ultra-dex-voice-${Date.now()}.${format}`);

  try {
    // Record audio from microphone
    await recordAudio(audioFilePath, duration);

    printInfo('🔄 Transcribing audio using OpenAI Whisper...');

    // Transcribe the recorded audio
    const transcription = await transcribeAudio(openai, audioFilePath);

    printSuccess('✅ Voice transcription completed');

    return transcription.trim();
  } catch (error) {
    printError(`Voice input failed: ${error.message}`);
    throw error;
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(audioFilePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Record audio from microphone to file
 * @param {string} outputPath - Path to save the recorded audio
 * @param {number} duration - Recording duration in seconds
 */
async function recordAudio(outputPath, duration) {
  return new Promise((resolve, reject) => {
    let recorder;

    // Choose appropriate recording command based on OS
    if (os.platform() === 'darwin') {
      // macOS
      // Using sox if available, otherwise fallback
      recorder = spawn('rec', [outputPath, 'trim', '0', `${duration}`], {
        stdio: 'pipe',
      });

      // If sox is not available, try afplay/arecord alternatives
      recorder.on('error', (err) => {
        // Try using built-in macOS commands
        try {
          recorder = spawn(
            'ffmpeg',
            [
              '-f',
              'avfoundation',
              '-i',
              ':0', // Use default audio device
              '-t',
              `${duration}`,
              '-c:a',
              'pcm_s16le',
              '-ar',
              '16000',
              '-y', // Overwrite output file
              outputPath,
            ],
            {
              stdio: 'pipe',
            }
          );

          setupRecorderHandlers(recorder, resolve, reject);
        } catch (ffmpegErr) {
          reject(new Error(`Audio recording failed. Install sox or ffmpeg: ${err.message}`));
        }
      });

      setupRecorderHandlers(recorder, resolve, reject);
    } else if (os.platform() === 'linux') {
      // Linux - use arecord if available
      recorder = spawn(
        'arecord',
        [
          '-d',
          `${duration}`,
          '-f',
          'cd', // CD quality (16bit, 44.1kHz)
          '-t',
          'wav',
          '-q', // Quiet mode
          outputPath,
        ],
        {
          stdio: 'pipe',
        }
      );

      setupRecorderHandlers(recorder, resolve, reject);
    } else {
      // Windows or other platforms - try ffmpeg
      recorder = spawn(
        'ffmpeg',
        [
          '-f',
          os.platform() === 'win32' ? 'dshow' : 'alsa',
          '-i',
          os.platform() === 'win32' ? 'audio="Microphone"' : 'hw:0,0',
          '-t',
          `${duration}`,
          '-c:a',
          'pcm_s16le',
          '-ar',
          '16000',
          '-y',
          outputPath,
        ],
        {
          stdio: 'pipe',
        }
      );

      setupRecorderHandlers(recorder, resolve, reject);
    }
  });
}

/**
 * Set up handlers for the recorder process
 */
function setupRecorderHandlers(recorder, resolve, reject) {
  recorder.stdout.on('data', (data) => {
    // Optionally log recorder output
  });

  recorder.stderr.on('data', (data) => {
    const stderr = data.toString();
    // Only warn about non-critical issues
    if (stderr.includes('overrun') || stderr.includes('underrun')) {
      logger.warn(`Audio recorder: ${stderr.trim()}`);
    }
  });

  recorder.on('close', (code) => {
    if (code === 0 || code === null) {
      resolve();
    } else {
      reject(new Error(`Audio recording failed with code ${code}`));
    }
  });

  recorder.on('error', (err) => {
    reject(new Error(`Audio recording error: ${err.message}`));
  });
}

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param {OpenAI} openai - OpenAI client instance
 * @param {string} audioFilePath - Path to audio file to transcribe
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(openai, audioFilePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: await fs.readFile(audioFilePath),
    model: 'whisper-1',
    response_format: 'text',
  });

  return transcription.trim();
}

/**
 * Check if required audio recording tools are available
 */
export async function checkAudioSupport() {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS
    try {
      // Check for ffmpeg
      const { exec } = await import('child_process');
      return new Promise((resolve) => {
        exec('which ffmpeg || which rec', (error, stdout) => {
          resolve(!error && stdout.trim().length > 0);
        });
      });
    } catch {
      return false;
    }
  } else if (platform === 'linux') {
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve) => {
        exec('which arecord', (error, stdout) => {
          resolve(!error && stdout.trim().length > 0);
        });
      });
    } catch {
      return false;
    }
  } else {
    // Windows
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve) => {
        exec('where ffmpeg', (error, stdout) => {
          resolve(!error && stdout.trim().length > 0);
        });
      });
    } catch {
      return false;
    }
  }
}

export default {
  recordAndTranscribe,
  checkAudioSupport,
};
