#!/usr/bin/env node

/**
 * ultra-dex voice - Voice-to-Plan command
 * 
 * Convert speech to implementation plans using Whisper API
 * One-shot or interactive voice mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('ultra-dex voice')
  .description('Voice-to-Plan: Convert speech to implementation plans')
  .version('1.0.0');

program
  .argument('[idea]', 'Idea or task description (if provided, runs one-shot mode)')
  .option('-p, --provider <provider>', 'Speech-to-text provider', 'whisper') // whisper, google, azure
  .option('-l, --language <lang>', 'Language code', 'en')
  .option('-o, --output <file>', 'Output file for generated plan')
  .option('--no-transcribe', 'Skip transcription, use text input directly')
  .option('--save-audio', 'Save recorded audio file')
  .option('-t, --template <template>', 'Template to use', 'lite')
  .action(async (idea, options) => {
    try {
      console.log(chalk.cyan.bold('\n🎤 Ultra-Dex Voice-to-Plan\n'));

      // Check for API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey && options.provider === 'whisper') {
        console.log(chalk.yellow('⚠️  OPENAI_API_KEY not found in environment'));
        console.log(chalk.gray('   Set it with: export OPENAI_API_KEY=your_key'));
        console.log(chalk.gray('   Or run with --no-transcribe to type your idea\n'));
      }

      let transcribedText = idea;

      // If no idea provided and not skipping transcription, enter interactive mode
      if (!idea && !options.noTranscribe) {
        console.log(chalk.blue('🎙️  Interactive Voice Mode'));
        console.log(chalk.gray('   Speak your idea clearly, then press Enter to stop\n'));
        
        const recording = await recordAudio(options);
        
        if (!recording) {
          console.log(chalk.red('❌ Recording failed'));
          return;
        }

        const spinner = ora('Transcribing with Whisper...').start();
        
        try {
          transcribedText = await transcribeAudio(recording.path, apiKey, options.language);
          spinner.succeed('Transcription complete');
          
          console.log(chalk.green('\n📝 Transcribed:'));
          console.log(chalk.white(`   "${transcribedText}"\n`));
          
          // Clean up temp file unless --save-audio
          if (!options.saveAudio) {
            await fs.unlink(recording.path);
          } else {
            console.log(chalk.gray(`   💾 Audio saved: ${recording.path}\n`));
          }
        } catch (error) {
          spinner.fail('Transcription failed');
          console.error(chalk.red(error.message));
          return;
        }
      } else if (idea) {
        console.log(chalk.blue('📝 One-shot mode'));
        console.log(chalk.gray(`   Input: "${idea}"\n`));
      }

      // Generate implementation plan from transcribed text
      console.log(chalk.cyan('🤖 Generating implementation plan...\n'));
      
      const plan = await generatePlan(transcribedText, options.template);
      
      // Output the plan
      console.log(chalk.green.bold('✅ Implementation Plan Generated\n'));
      console.log(chalk.white(plan));

      // Save to file if specified
      if (options.output) {
        await fs.writeFile(options.output, plan, 'utf8');
        console.log(chalk.green(`\n💾 Saved to: ${options.output}`));
      }

      // Suggest next steps
      console.log(chalk.gray('\n💡 Next steps:'));
      console.log(chalk.gray('   1. Review the generated plan'));
      console.log(chalk.gray('   2. Run: ultra-dex init to create project'));
      console.log(chalk.gray('   3. Run: ultra-dex build to start development'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Record audio from microphone (cross-platform)
 */
async function recordAudio(options) {
  const tempDir = os.tmpdir();
  const outputFile = path.join(tempDir, `ultra-dex-voice-${Date.now()}.wav`);
  
  return new Promise((resolve, reject) => {
    let recorder;
    
    if (process.platform === 'darwin') {
      // macOS - use sox or afrecord
      recorder = spawn('afrecord', ['-q', '-f', 'WAVE', '-d', outputFile]);
    } else if (process.platform === 'linux') {
      // Linux - use arecord
      recorder = spawn('arecord', ['-f', 'cd', '-t', 'wav', outputFile]);
    } else if (process.platform === 'win32') {
      // Windows - would need PowerShell or external tool
      console.log(chalk.yellow('⚠️  Windows recording not yet supported'));
      console.log(chalk.gray('   Please type your idea instead\n'));
      resolve(null);
      return;
    }

    if (!recorder) {
      console.log(chalk.yellow('⚠️  No recording tool found'));
      console.log(chalk.gray('   Install: brew install sox (macOS) or apt-get install alsa-utils (Linux)\n'));
      resolve(null);
      return;
    }

    console.log(chalk.yellow('🔴 Recording... (Press Enter when done)'));

    // Wait for user to press Enter
    process.stdin.once('data', () => {
      recorder.kill('SIGTERM');
    });

    recorder.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve({ path: outputFile, duration: 'unknown' });
      } else {
        reject(new Error(`Recording failed with code ${code}`));
      }
    });

    recorder.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioPath, apiKey, language) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for transcription');
  }

  const audioData = await fs.readFile(audioPath);
  
  const formData = new FormData();
  formData.append('file', new Blob([audioData], { type: 'audio/wav' }), 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('language', language);
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const data = await response.json();
  return data.text;
}

/**
 * Generate implementation plan from text
 */
async function generatePlan(idea, template) {
  // For now, generate a template-based plan
  // In production, this would use an AI provider to generate the plan
  
  const templates = {
    lite: generateLiteTemplate,
    full: generateFullTemplate,
    enterprise: generateEnterpriseTemplate,
  };

  const generator = templates[template] || generateLiteTemplate;
  return generator(idea);
}

function generateLiteTemplate(idea) {
  return `
# Implementation Plan: ${idea}

Generated from voice input using Ultra-Dex Voice-to-Plan

## Quick Summary
**Idea:** ${idea}
**Template:** LITE (12 sections)
**Estimated Time:** 2-3 weeks

## Sections to Complete

### 1. High-Level Summary
- **Product Vision:** [One-liner describing ${idea}]
- **Problem:** [What problem does this solve?]
- **Solution:** [How does it solve it?]

### 2. Core Features (Max 5)
| Feature | Priority | Est. Hours |
|---------|----------|------------|
| Core MVP | P0 | 4-6h |
| Secondary | P1 | 4-6h |
| Nice-to-have | P2 | 2-4h |

### 3. User Personas
- Primary: [Who is this for?]

### 4. User Flows
- Main flow: [Describe key user journey]

### 5. Screen Map
- Home, Dashboard, Settings

### 6. Tech Stack
- Frontend: Next.js 15
- Database: Supabase
- Auth: Clerk
- Hosting: Vercel

### 7. Data Model
- User entity
- Main resource entity

### 8. API Blueprint
- Auth endpoints
- CRUD endpoints

### 9. Implementation Plan
- Sprint 1: Foundation
- Sprint 2: Core features
- Sprint 3: Polish

### 10. Deployment
- Platform: Vercel
- Environment variables
- Launch checklist

### 11. Security
- Auth, validation, HTTPS

### 12. 21-Step Verification
- Use for each task

---

Run: ultra-dex init to get started with this plan
`;
}

function generateFullTemplate(idea) {
  return `
# Implementation Plan: ${idea}

Generated from voice input using Ultra-Dex Voice-to-Plan
**Template:** FULL (34 sections)
**Estimated Time:** 8-12 weeks

This is the complete Ultra-Dex template with all sections.
Run: ultra-dex init --template full to generate full template

Quick Start:
1. Fill sections 1-8 (Foundation) - 4-5 hours
2. Start Sprint 1 development
3. Use ultra-dex swarm for implementation
4. Verify each task with 21-step checklist
`;
}

function generateEnterpriseTemplate(idea) {
  return `
# Implementation Plan: ${idea}

Generated from voice input using Ultra-Dex Voice-to-Plan
**Template:** ENTERPRISE (50+ sections)
**Estimated Time:** 20-40 weeks

This is the enterprise-grade template with compliance and governance.
Run: ultra-dex init --template enterprise for full details

Includes:
- Strategy (sections 1-8)
- Architecture (9-20)
- Governance (21-35)
- Scale (36-45)
- Compliance (46-50)

Team required: 4-8 developers
Budget: $50K-200K
`;
}

// Helpful subcommands
program
  .command('test')
  .description('Test microphone and transcription')
  .action(async () => {
    console.log(chalk.cyan('\n🎤 Testing Voice-to-Plan\n'));
    
    // Test recording
    console.log(chalk.blue('Testing microphone...'));
    const recording = await recordAudio({});
    
    if (recording) {
      console.log(chalk.green('✅ Microphone working'));
      
      // Test transcription if API key available
      if (process.env.OPENAI_API_KEY) {
        console.log(chalk.blue('Testing transcription...'));
        try {
          const text = await transcribeAudio(recording.path, process.env.OPENAI_API_KEY, 'en');
          console.log(chalk.green('✅ Transcription working'));
          console.log(chalk.gray(`   Heard: "${text.substring(0, 50)}..."`));
          await fs.unlink(recording.path);
        } catch (e) {
          console.log(chalk.red('❌ Transcription failed'), e.message);
        }
      } else {
        console.log(chalk.yellow('⚠️  No OPENAI_API_KEY, skipping transcription test'));
        await fs.unlink(recording.path);
      }
    } else {
      console.log(chalk.red('❌ Microphone not available'));
    }
  });

program
  .command('setup')
  .description('Setup voice-to-plan requirements')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🎤 Voice-to-Plan Setup\n'));
    
    console.log(chalk.white.bold('Requirements:\n'));
    
    // Check OpenAI API Key
    if (process.env.OPENAI_API_KEY) {
      console.log(chalk.green('✅ OPENAI_API_KEY configured'));
    } else {
      console.log(chalk.red('❌ OPENAI_API_KEY not found'));
      console.log(chalk.gray('   Add to your shell profile:'));
      console.log(chalk.gray('   export OPENAI_API_KEY=sk-...'));
    }
    
    // Check recording tools
    console.log(chalk.blue('\n🔧 Recording Tools:'));
    
    if (process.platform === 'darwin') {
      console.log(chalk.gray('   macOS: Uses afrecord (built-in)'));
      console.log(chalk.green('   ✅ Ready'));
    } else if (process.platform === 'linux') {
      console.log(chalk.gray('   Linux: Requires arecord'));
      console.log(chalk.gray('   Install: sudo apt-get install alsa-utils'));
    } else if (process.platform === 'win32') {
      console.log(chalk.yellow('   Windows: Not yet supported'));
      console.log(chalk.gray('   Please use text input mode'));
    }
    
    console.log(chalk.cyan('\n💡 Usage:'));
    console.log(chalk.gray('   ultra-dex voice "Build a task manager app"'));
    console.log(chalk.gray('   ultra-dex voice (interactive mode)'));
  });

program.parse();
