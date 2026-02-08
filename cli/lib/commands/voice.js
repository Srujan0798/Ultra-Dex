import { Command } from 'commander';
import { voiceToCodeService } from '../lib/voice/voice-service.js';
import { printInfo, printSuccess, printError } from '../lib/utils/output.js';

export function registerVoiceCommand(program) {
  const voiceCommand = program
    .command('voice')
    .description('Convert voice commands to code using Whisper API');

  voiceCommand
    .argument('[command]', 'Voice command or leave empty to record')
    .option('-r, --record', 'Start voice recording')
    .option('-f, --file <path>', 'Use audio file instead of recording')
    .option('-p, --provider <provider>', 'AI provider to use (openai, anthropic, google)', 'openai')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-k, --key <key>', 'API key override')
    .option('-w, --write', 'Write generated code to files')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (command, options) => {
      try {
        if (options.record || !command) {
          // Start recording
          printInfo('🎤 Starting voice recording...');
          await voiceToCodeService.startRecording();
          
          // Wait for user to stop recording (Ctrl+C or timeout)
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              voiceToCodeService.stopRecording()
                .then(resolve)
                .catch(reject);
            }, 30000); // 30 second timeout
            
            process.once('SIGINT', () => {
              clearTimeout(timeout);
              voiceToCodeService.stopRecording()
                .then(resolve)
                .catch(reject);
            });
          });
          
          // Transcribe the recorded audio
          const audioFile = await voiceToCodeService.getAudioFile();
          printInfo('🔄 Transcribing audio...');
          const transcribedText = await voiceToCodeService.transcribeAudio(audioFile, options.key);
          
          printSuccess(`🎤 Transcribed: "${transcribedText}"`);
          command = transcribedText;
        } else if (options.file) {
          // Use provided audio file
          printInfo(`🎤 Transcribing file: ${options.file}`);
          const transcribedText = await voiceToCodeService.transcribeAudio(options.file, options.key);
          printSuccess(`🎤 Transcribed: "${transcribedText}"`);
          command = transcribedText;
        }

        if (!command) {
          printError('No voice command provided. Use --record to record or provide a command.');
          return;
        }

        printInfo(`🤖 Processing voice command: "${command}"`);
        
        // Convert voice command to code
        const result = await voiceToCodeService.voiceToCode(command, {
          provider: options.provider,
          model: options.model,
          apiKey: options.key,
          writeToFiles: options.write,
          verbose: options.verbose
        });

        if (result.success) {
          printSuccess(result.message);
          
          if (result.generatedCode && options.verbose) {
            printInfo('\n📝 Generated Code:');
            console.log(result.generatedCode);
          }
          
          if (result.files && result.files.length > 0) {
            printInfo(`\n📁 Generated ${result.files.length} files:`);
            result.files.forEach(file => {
              printSuccess(`  - ${file.path}`);
            });
          }
        } else {
          printError(`❌ ${result.message}`);
        }
      } catch (error) {
        printError(`Voice command failed: ${error.message}`);
        if (options.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  // Add subcommands for voice management
  voiceCommand
    .command('start-recording')
    .description('Start voice recording')
    .action(async () => {
      try {
        await voiceToCodeService.startRecording();
        printSuccess('🎤 Recording started. Press Ctrl+C to stop.');
      } catch (error) {
        printError(`Failed to start recording: ${error.message}`);
        process.exit(1);
      }
    });

  voiceCommand
    .command('stop-recording')
    .description('Stop voice recording')
    .action(async () => {
      try {
        const result = await voiceToCodeService.stopRecording();
        printSuccess(`🎤 Recording stopped. Saved to: ${result.audioFile}`);
      } catch (error) {
        printError(`Failed to stop recording: ${error.message}`);
        process.exit(1);
      }
    });

  voiceCommand
    .command('transcribe')
    .argument('<file>', 'Audio file to transcribe')
    .option('-k, --key <key>', 'API key override')
    .description('Transcribe audio file to text')
    .action(async (file, options) => {
      try {
        printInfo(`🎤 Transcribing: ${file}`);
        const text = await voiceToCodeService.transcribeAudio(file, options.key);
        printSuccess(`📝 Transcribed text:\n${text}`);
      } catch (error) {
        printError(`Transcription failed: ${error.message}`);
        process.exit(1);
      }
    });
}

export default registerVoiceCommand;