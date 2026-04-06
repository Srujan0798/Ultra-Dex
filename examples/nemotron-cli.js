#!/usr/bin/env node

/**
 * Ultra-Dex Nemotron CLI
 * Use NVIDIA Nemotron-3-Super for free via their API
 * 
 * Usage:
 *   node nemotron-cli.js "Your prompt here"
 *   node nemotron-cli.js --stream "Your prompt here"
 *   node nemotron-cli.js --no-thinking "Quick question?"
 */

import { createNemotronClient, chatWithNemotron, streamWithNemotron } from '../src/services/ai-providers/nemotron.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { spawn } from 'child_process';

dotenv.config();

const API_KEY = process.env.NVIDIA_API_KEY;

function printBanner() {
  console.log(chalk.green.bold('\n🚀 Ultra-Dex Nemotron CLI'));
  console.log(chalk.gray('   Powered by NVIDIA Nemotron-3-Super 120B\n'));
}

function printUsage() {
  console.log(`
${chalk.yellow('Usage:')}
  node nemotron-cli.js [options] "your prompt"

${chalk.yellow('Options:')}
  --stream, -s      Stream the response in real-time
  --no-thinking     Disable reasoning mode (faster, simpler responses)
  --help, -h        Show this help message

${chalk.yellow('Examples:')}
  node nemotron-cli.js "Explain quantum computing"
  node nemotron-cli.js --stream "Write a Python function to sort an array"
  node nemotron-cli.js --no-thinking "What is 2+2?"

${chalk.yellow('Setup:')}
  1. Get free API key: https://build.nvidia.com/
  2. Add to .env.local: NVIDIA_API_KEY=your-key-here
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printBanner();
    printUsage();
    process.exit(0);
  }

  if (!API_KEY) {
    console.error(chalk.red.bold('\n❌ Error: NVIDIA_API_KEY not found'));
    console.error(chalk.yellow('\nSetup instructions:'));
    console.error('  1. Get free API key: https://build.nvidia.com/');
    console.error('  2. Create .env.local file');
    console.error('  3. Add: NVIDIA_API_KEY=your-key-here\n');
    process.exit(1);
  }

  const streamMode = args.includes('--stream') || args.includes('-s');
  const noThinking = args.includes('--no-thinking');
  const prompt = args.filter(a => !a.startsWith('--')).join(' ');

  if (!prompt) {
    console.error(chalk.red('Error: No prompt provided'));
    printUsage();
    process.exit(1);
  }

  printBanner();
  console.log(chalk.gray(`Prompt: ${chalk.white(prompt)}\n`));
  console.log(chalk.gray('Thinking...') + '\n');

  const client = createNemotronClient(API_KEY);

  try {
    if (streamMode) {
      console.log(chalk.green('Response (streaming):') + '\n');
      const response = await streamWithNemotron({
        client,
        messages: [{ role: 'user', content: prompt }],
        enableThinking: !noThinking,
        onChunk: (chunk) => {
          process.stdout.write(chunk);
        },
      });
      console.log('\n');
    } else {
      console.log(chalk.green('Response:') + '\n');
      const response = await chatWithNemotron({
        client,
        messages: [{ role: 'user', content: prompt }],
        enableThinking: !noThinking,
        maxTokens: 4096,
      });
      console.log(chalk.white(response) + '\n');
    }
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error:'), error.message);
    if (error.response) {
      const data = await error.response.json?.();
      console.error(chalk.gray('Details:', JSON.stringify(data, null, 2)));
    }
    process.exit(1);
  }
}

main();
