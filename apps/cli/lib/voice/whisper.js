// Copyright (c) 2026 Ultra-Dex
// Whisper Service
// Handles audio transcription using OpenAI Whisper API

import fs from 'fs';
import OpenAI from 'openai';

export class WhisperService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.openai = new OpenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Transcribe audio file to text
   * @param {string} filePath - Path to audio file
   * @param {string} [language='en'] - Language code
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(filePath, language = 'en') {
    if (!this.openai) {
      // Lazy init if key wasn't available at construction
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      } else {
        throw new Error('OPENAI_API_KEY is required for transcription');
      }
    }

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language,
        response_format: 'text', // MVP: just get text
      });

      return typeof response === 'string' ? response.trim() : response.text.trim();
    } catch (error) {
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return !!(this.apiKey || process.env.OPENAI_API_KEY);
  }
}

export const whisperService = new WhisperService();
export default whisperService;
