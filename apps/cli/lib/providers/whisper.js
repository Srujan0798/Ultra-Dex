// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Whisper module
 * @module providers/whisper
 */

import fs from 'fs/promises';
import path from 'path';

export class WhisperProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async transcribe(filePath, language = 'en') {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is required for Whisper transcription');
    if (typeof FormData === 'undefined' || typeof fetch === 'undefined') {
      throw new Error('Whisper provider requires global fetch and FormData (Node 18+).');
    }

    const data = new FormData();
    data.append('file', await fs.readFile(filePath), path.basename(filePath));
    data.append('model', 'whisper-1');
    data.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: data,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Whisper error: ${text}`);
    }

    const json = await response.json();
    return json.text;
  }
}

export default WhisperProvider;

/**
 * Safe execution wrapper with error handling for whisper
 * @param {Function} fn - Async function to execute
 * @param {string} [context='whisper'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'whisper') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
