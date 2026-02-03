import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { SYSTEM_PROMPT, generateUserPrompt } from '../templates/prompts/generate-plan.js';

export function registerVoiceCommand(program) {
  program
    .command('voice [idea]')
    .description('Voice-to-Plan: Convert speech to implementation plans')
    .option('-p, --provider <provider>', 'Speech-to-text provider', 'whisper')
    .option('-l, --language <lang>', 'Language code', 'en')
    .option('-o, --output <file>', 'Output file for generated plan', 'IMPLEMENTATION-PLAN.md')
    .option('--no-transcribe', 'Skip transcription, use text input directly')
    .option('--save-audio', 'Save recorded audio file')
    .option('--no-plan', 'Only transcribe, do not generate a full 34-section plan')
    .option('--ai-provider <provider>', 'AI provider for plan generation')
    .action(async (idea, options) => {
      try {
        console.log(chalk.cyan.bold('\n🎤 Ultra-Dex Voice-to-Plan\n'));

        // Check for OpenAI API key if transcribing
        const whisperKey = process.env.OPENAI_API_KEY;
        if (!whisperKey && !options.noTranscribe && !idea) {
          console.log(chalk.yellow('⚠️  OPENAI_API_KEY not found. Transcription requires Whisper API.'));
          console.log(chalk.gray('   export OPENAI_API_KEY=sk-...'));
          return;
        }

        let transcribedText = idea;

        // 1. Transcription Phase
        if (!idea && !options.noTranscribe) {
          console.log(chalk.blue('🎙️  Interactive Voice Mode'));
          console.log(chalk.gray('   Speak your idea, then press Enter to stop recording.\n'));
          
          const recording = await recordAudio(options);
          if (!recording) return;

          const spinner = ora('Transcribing with Whisper...').start();
          try {
            transcribedText = await transcribeAudio(recording.path, whisperKey, options.language);
            spinner.succeed('Transcription complete');
            console.log(chalk.green(`\n📝 Heard: "\${transcribedText}"\n`));
            
            if (!options.saveAudio) await fs.unlink(recording.path).catch(() => {});
          } catch (error) {
            spinner.fail('Transcription failed');
            console.error(chalk.red(error.message));
            return;
          }
        }

        if (!transcribedText) {
            console.log(chalk.red('❌ No input detected.'));
            return;
        }

        // 2. Planning Phase
        if (options.plan !== false) {
            const aiProviderId = options.aiProvider || getDefaultProvider();
            if (!aiProviderId) {
                console.log(chalk.yellow('⚠️  No AI provider configured for plan generation.'));
                console.log(chalk.gray('   Skipping plan generation. Here is your transcription:'));
                console.log(chalk.white(`   \${transcribedText}`));
                return;
            }

            const spinner = ora('Manifesting reality (Generating Plan)...').start();
            try {
                const provider = createProvider(aiProviderId);
                const result = await provider.generate(SYSTEM_PROMPT, generateUserPrompt(transcribedText));
                const planContent = result.content;
                
                const outputPath = path.resolve(options.output);
                await fs.writeFile(outputPath, planContent);
                
                spinner.succeed(chalk.green(`Plan successfully generated and saved to \${options.output}!`));
            } catch (error) {
                spinner.fail('Plan generation failed');
                console.error(chalk.red(error.message));
            }
        } else {
            console.log(chalk.green('✅ Transcription ready:'));
            console.log(chalk.white(`\${transcribedText}`));
        }

        console.log(chalk.bold('\nNext steps:'));
        console.log(chalk.cyan('  1. Review your plan: cat \${options.output}'));
        console.log(chalk.cyan('  2. Initialize project: ultra-dex init'));

      } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
      }
    });
}

async function recordAudio(options) {
    const tempDir = os.tmpdir();
    const outputFile = path.join(tempDir, `ultra-dex-voice-${Date.now()}.wav`);
    
    return new Promise((resolve, reject) => {
        let recorder;
        if (process.platform === 'darwin') {
            recorder = spawn('afrecord', ['-q', '-f', 'WAVE', '-d', outputFile]);
        } else if (process.platform === 'linux') {
            recorder = spawn('arecord', ['-f', 'cd', '-t', 'wav', outputFile]);
        } else {
            console.log(chalk.yellow('⚠️ Recording not supported on this OS. Please use text input.'));
            return resolve(null);
        }

        console.log(chalk.red('🔴 Recording... (Press ENTER to stop)'));

        process.stdin.once('data', () => {
            recorder.kill('SIGTERM');
        });

        recorder.on('close', (code) => {
            if (code === 0 || code === null) resolve({ path: outputFile });
            else reject(new Error(`Recording failed (code ${code})`));
        });
    });
}

async function transcribeAudio(audioPath, apiKey, language) {
    const audioData = await fs.readFile(audioPath);
    const formData = new FormData();
    formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
    });

    if (!response.ok) throw new Error(`Whisper API error: ${await response.text()}`);
    const data = await response.json();
    return data.text;
}
