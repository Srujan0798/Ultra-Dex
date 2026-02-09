// Copyright (c) 2026 Ultra-Dex
// Voice Recorder Service
// Wraps node-record-lpcm16 for cross-platform audio capture

import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

// Optional dependency for voice recording
let recorder;
try {
    recorder = (await import('node-record-lpcm16')).default;
} catch (e) {
    recorder = null;
    // console.warn('Optional dependency "node-record-lpcm16" not found. Voice recording disabled.');
}

export class AudioRecorder extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sampleRate: 16000, // Whisper optimal
            threshold: 0.5,    // Silence threshold
            silence: '1.0',    // Seconds of silence to end recording
            verbose: false,
            recordProgram: 'rec', // Try 'rec' (sox), then 'arecord', then 'sox'
            ...options
        };
        this.process = null;
        this.stream = null;
        this.recording = false;
    }

    /**
     * Start recording to a file
     * @param {string} [filePath] - Optional output path, defaults to temp file
     * @returns {Promise<string>} - Path to recorded file
     */
    start(filePath) {
        if (this.recording) {
            throw new Error('Already recording');
        }

        const output = filePath || path.join(os.tmpdir(), `ultra-dex-voice-${Date.now()}.wav`);
        const fileStream = fs.createWriteStream(output, { encoding: 'binary' });

        console.log('🎤 Recording... (Speak now)');

        this.stream = recorder.record({
            sampleRate: this.options.sampleRate,
            threshold: this.options.threshold,
            silence: this.options.silence,
            verbose: this.options.verbose,
            recordProgram: this.options.recordProgram
        }).stream();

        this.stream.pipe(fileStream);
        this.recording = true;

        this.stream.on('end', () => {
            this.recording = false;
            this.emit('end', output);
        });

        this.stream.on('error', (err) => {
            this.recording = false;
            this.emit('error', err);
        });

        return output;
    }

    /**
     * Stop recording manually
     */
    stop() {
        if (!this.recording) return;
        recorder.stop();
        this.recording = false;
    }
}

export const audioRecorder = new AudioRecorder();
export default audioRecorder;
