/**
 * Voice Input Integration using OpenAI Whisper API
 * Enables speech-to-text for natural language commands
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Check if required dependencies are available
const DEPENDENCIES = {
    sox: 'sox',      // For audio recording
    ffmpeg: 'ffmpeg' // For audio conversion
};

/**
 * Check if a command exists in PATH
 */
function commandExists(cmd) {
    try {
        const { execSync } = require('child_process');
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Record audio from microphone
 * Returns path to recorded WAV file
 */
export async function recordAudio(durationSeconds = 5, options = {}) {
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `ultra-dex-voice-${Date.now()}.wav`);

    if (!commandExists('sox')) {
        throw new Error('sox not installed. Install with: brew install sox (mac) or apt install sox (linux)');
    }

    return new Promise((resolve, reject) => {
        console.log(`🎤 Recording for ${durationSeconds} seconds... (speak now)`);

        const args = [
            '-d',                    // Default audio device
            '-r', '16000',           // 16kHz sample rate (Whisper optimal)
            '-c', '1',               // Mono
            '-b', '16',              // 16-bit
            outputPath,
            'trim', '0', String(durationSeconds)
        ];

        const sox = spawn('sox', args);

        sox.stderr.on('data', (data) => {
            if (options.verbose) {
                console.log(`sox: ${data}`);
            }
        });

        sox.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                console.log('✅ Recording complete');
                resolve(outputPath);
            } else {
                reject(new Error(`Recording failed with code ${code}`));
            }
        });

        sox.on('error', (err) => {
            reject(new Error(`Failed to record: ${err.message}`));
        });
    });
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioPath, apiKey) {
    if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY;
    }

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required for Whisper transcription');
    }

    const FormData = (await import('node-fetch')).FormData || globalThis.FormData;
    const fetch = (await import('node-fetch')).default || globalThis.fetch;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error: ${error}`);
    }

    const result = await response.json();
    return result.text;
}

/**
 * Record and transcribe in one step
 */
export async function voiceToText(durationSeconds = 5, options = {}) {
    const audioPath = await recordAudio(durationSeconds, options);

    try {
        console.log('🔄 Transcribing...');
        const text = await transcribeAudio(audioPath, options.apiKey);
        console.log(`📝 Transcribed: "${text}"`);
        return text;
    } finally {
        // Clean up temp file
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
    }
}

/**
 * Continuous voice listening mode
 * Uses silence detection to auto-stop recording
 */
export async function continuousListen(callback, options = {}) {
    const silenceThreshold = options.silenceThreshold || 0.5; // seconds
    const maxDuration = options.maxDuration || 30; // seconds

    console.log('👂 Listening... (speak when ready, silence ends recording)');

    // Use sox with silence detection
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `ultra-dex-voice-${Date.now()}.wav`);

    return new Promise((resolve, reject) => {
        const args = [
            '-d',
            '-r', '16000',
            '-c', '1',
            '-b', '16',
            outputPath,
            'silence', '1', '0.1', '3%',     // Start on voice
            '1', String(silenceThreshold), '3%', // End on silence
            'trim', '0', String(maxDuration)
        ];

        const sox = spawn('sox', args);

        sox.on('close', async (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const text = await transcribeAudio(outputPath, options.apiKey);
                    fs.unlinkSync(outputPath);

                    if (callback) {
                        callback(text);
                    }
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error('Recording failed'));
            }
        });

        sox.on('error', reject);
    });
}

/**
 * Voice command handler for Ultra-Dex CLI
 */
export async function handleVoiceCommand(router, options = {}) {
    try {
        const text = await voiceToText(options.duration || 5, options);

        if (!text || text.trim().length === 0) {
            console.log('❌ No speech detected');
            return null;
        }

        // Route the transcribed text through NLP router
        const intent = router(text);

        if (intent) {
            console.log(`🎯 Intent: ${intent}`);
            return { text, intent };
        } else {
            console.log('❓ Could not determine intent from speech');
            return { text, intent: null };
        }
    } catch (error) {
        console.error(`🔇 Voice error: ${error.message}`);
        return null;
    }
}

/**
 * Check voice input prerequisites
 */
export function checkVoicePrerequisites() {
    const missing = [];

    if (!commandExists('sox')) {
        missing.push('sox (audio recording)');
    }

    if (!process.env.OPENAI_API_KEY) {
        missing.push('OPENAI_API_KEY environment variable');
    }

    return {
        ready: missing.length === 0,
        missing,
        installInstructions: missing.length > 0 ? [
            'To enable voice input:',
            '  macOS: brew install sox',
            '  Linux: sudo apt install sox',
            '  Set OPENAI_API_KEY in your environment'
        ].join('\n') : null
    };
}

export default {
    recordAudio,
    transcribeAudio,
    voiceToText,
    continuousListen,
    handleVoiceCommand,
    checkVoicePrerequisites
};
