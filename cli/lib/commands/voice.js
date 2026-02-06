// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import {
  getSystemPrompt,
  generateUserPrompt,
  normalizeTemplate,
} from '../templates/prompts/generate-plan.js';
import { validateSafePath } from '../utils/validation.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

const TEMPLATE_LABELS = {
  lite: 'LITE (12 sections)',
  full: 'FULL (34 sections)',
  enterprise: 'ENTERPRISE (50+ sections)',
};

const TEMPLATE_TOKEN_HINTS = {
  lite: 8000,
  full: 16000,
  enterprise: 16000,
};

const MODE_OPTIONS = new Set(['auto', 'interactive', 'oneshot']);

export function registerVoiceCommand(program) {
  program
    .command('voice [idea]')
    .description('Voice-to-Plan: Convert speech to implementation plans')
    .option('-p, --provider <provider>', 'Speech-to-text provider', 'whisper')
    .option('-l, --language <lang>', 'Language code', 'en')
    .option('-o, --output <file>', 'Output file for generated plan', 'IMPLEMENTATION-PLAN.md')
    .option('-t, --template <template>', 'Plan template: lite | full | enterprise')
    .option('--mode <mode>', 'Mode: interactive | one-shot', 'auto')
    .option('--no-transcribe', 'Skip transcription, use text input directly')
    .option('--save-audio', 'Save recorded audio file')
    .option('--no-plan', 'Only transcribe, do not generate a plan')
    .option('--ai-provider <provider>', 'AI provider for plan generation')
    .action(async (idea, options) => {
      try {
        printInfo(chalk.cyan.bold('\n🎤 Ultra-Dex Voice-to-Plan\n'));

        const modeInput = normalizeModeInput(options.mode);
        if (!modeInput) {
          printError(`Unknown mode "${options.mode}". Use: interactive | one-shot`);
          return;
        }
        const mode = resolveMode(modeInput, idea);
        const templateSelection = normalizeTemplate(options.template, null);
        if (options.template && !templateSelection) {
          printError(`Unknown template "${options.template}". Use: lite, full, enterprise.`);
          return;
        }

        const sttProvider = options.provider?.toLowerCase();
        if (sttProvider && sttProvider !== 'whisper') {
          printError(
            `Unsupported STT provider "${options.provider}". Only "whisper" is supported.`
          );
          return;
        }

        // Check for OpenAI API key if transcribing
        const whisperKey = process.env.OPENAI_API_KEY;
        if (!whisperKey && !options.noTranscribe && !idea) {
          printWarning('OPENAI_API_KEY not found. Transcription requires Whisper API.');
          printInfo('   export OPENAI_API_KEY=sk-...');
          return;
        }

        let transcribedText = idea;

        // 1. Transcription Phase
        if (!idea && options.noTranscribe) {
          if (mode === 'interactive') {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'idea',
                message: 'Describe what you want to build:',
                validate: (input) =>
                  input.trim().length > 5 || 'Please provide a clearer description',
              },
            ]);
            transcribedText = answers.idea;
          } else {
            printError('No input provided. Provide an idea or enable transcription.');
            return;
          }
        }

        if (!idea && !options.noTranscribe) {
          printInfo(chalk.blue('🎙️  Interactive Voice Mode'));
          printInfo(chalk.gray('   Speak your idea, then press Enter to stop recording.\n'));

          const recording = await recordAudio(options);
          if (!recording) return;

          const spinner = ora('Transcribing with Whisper...').start();
          try {
            transcribedText = await transcribeAudio(recording.path, whisperKey, options.language);
            spinner.succeed('Transcription complete');
            printSuccess(`\n📝 Heard: "${transcribedText}"\n`);

            if (mode === 'interactive') {
              const { confirm } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'confirm',
                  message: 'Use this transcription?',
                  default: true,
                },
              ]);

              if (!confirm) {
                const { edited } = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'edited',
                    message: 'Edit your idea:',
                    default: transcribedText,
                    validate: (input) =>
                      input.trim().length > 5 || 'Please provide a clearer description',
                  },
                ]);
                transcribedText = edited;
              }
            }

            if (!options.saveAudio) await fs.unlink(recording.path).catch(() => {});
          } catch (error) {
            spinner.fail('Transcription failed');
            printError(error.message);
            return;
          }
        }

        if (!transcribedText) {
          printError('No input detected.');
          return;
        }

        // 2. Planning Phase
        if (options.plan !== false) {
          const aiProviderId = options.aiProvider || getDefaultProvider();
          if (!aiProviderId) {
            printWarning('No AI provider configured for plan generation.');
            printInfo('   Skipping plan generation. Here is your transcription:');
            printInfo(`   ${transcribedText}`);
            return;
          }

          let template = templateSelection || 'full';
          if (mode === 'interactive' && !templateSelection) {
            const answer = await inquirer.prompt([
              {
                type: 'list',
                name: 'template',
                message: 'Choose plan template:',
                choices: [
                  { name: TEMPLATE_LABELS.lite, value: 'lite' },
                  { name: TEMPLATE_LABELS.full, value: 'full' },
                  { name: TEMPLATE_LABELS.enterprise, value: 'enterprise' },
                ],
                default: 'full',
              },
            ]);
            template = answer.template;
          }

          const outputValidation = validateSafePath(options.output, 'Output file');
          if (outputValidation !== true) {
            printError(outputValidation);
            return;
          }

          const spinner = ora('Manifesting reality (Generating Plan)...').start();
          try {
            const provider = createProvider(aiProviderId, {
              maxTokens: TEMPLATE_TOKEN_HINTS[template] || 16000,
            });
            const result = await provider.generate(
              getSystemPrompt(template),
              generateUserPrompt(transcribedText, template)
            );
            const planContent = result.content;

            const outputPath = path.resolve(options.output);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, planContent);

            spinner.succeed(
              chalk.green(
                `Plan successfully generated (${TEMPLATE_LABELS[template]}) and saved to ${options.output}!`
              )
            );
          } catch (error) {
            spinner.fail('Plan generation failed');
            printError(error.message);
          }
        } else {
          printSuccess('Transcription ready:');
          printInfo(`${transcribedText}`);
        }

        printInfo(chalk.bold('\nNext steps:'));
        if (options.plan !== false) {
          printInfo(`  1. Review your plan: cat ${options.output}`);
          printInfo('  2. Initialize project: ultra-dex init');
        } else {
          printInfo('  1. Use your transcription to refine the idea');
          printInfo(`  2. Generate a plan: ultra-dex voice "${transcribedText}"`);
        }
      } catch (error) {
        printError('\n❌ Error:', error.message);
        process.exit(1);
      }
    });
}

function resolveMode(modeInput, idea) {
  if (modeInput === 'auto') {
    return idea ? 'oneshot' : 'interactive';
  }
  return modeInput;
}

function normalizeModeInput(input) {
  const raw = (input || 'auto').toString().trim().toLowerCase();
  const normalized = raw.replace(/[-_]/g, '');
  if (MODE_OPTIONS.has(normalized)) return normalized;
  if (MODE_OPTIONS.has(raw)) return raw;
  return null;
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
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Whisper API error: ${await response.text()}`);
  const data = await response.json();
  return data.text;
}
