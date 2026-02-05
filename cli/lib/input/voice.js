import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { WhisperProvider } from '../providers/whisper.js';

export async function recordAudio() {
  const tempDir = os.tmpdir();
  const outputFile = path.join(tempDir, `ultra-dex-input-${Date.now()}.wav`);

  return new Promise((resolve, reject) => {
    let recorder;
    if (process.platform === 'darwin') {
      recorder = spawn('afrecord', ['-q', '-f', 'WAVE', '-d', outputFile]);
    } else if (process.platform === 'linux') {
      recorder = spawn('arecord', ['-f', 'cd', '-t', 'wav', outputFile]);
    } else {
      return reject(new Error('Recording not supported on this OS.'));
    }

    process.stdin.once('data', () => {
      recorder.kill('SIGTERM');
    });

    recorder.on('close', (code) => {
      if (code === 0 || code === null) resolve(outputFile);
      else reject(new Error(`Recording failed (code ${code})`));
    });
  });
}

export async function transcribeAudio(filePath) {
  const provider = new WhisperProvider();
  return provider.transcribe(filePath);
}

export async function captureVoiceInput() {
  const filePath = await recordAudio();
  return transcribeAudio(filePath);
}
