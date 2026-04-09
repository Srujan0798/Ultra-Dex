#!/usr/bin/env node

/**
 * Ultra-Dex Nemotron CLI Example
 * Use NVIDIA Nemotron-3-Super for free via their API
 *
 * Usage:
 *   node examples/nemotron-cli.js "Your prompt here"
 *   node examples/nemotron-cli.js --stream "Your prompt here"
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const API_KEY = process.env.NVIDIA_API_KEY;
const MODEL = 'nvidia/nemotron-3-super-120b-a12b';

function printBanner() {
  console.log(chalk.green.bold('\n🚀 Ultra-Dex Nemotron CLI'));
  console.log(chalk.gray('   Powered by NVIDIA Nemotron-3-Super 120B\n'));
}

function printUsage() {
  console.log(`
${chalk.yellow('Usage:')}
  node nemotron-cli.js [options] "your prompt"

${chalk.yellow('Options:')}
  --stream       Stream the response
  --no-thinking  Disable thinking process output
  --help         Show this help

${chalk.yellow('Examples:')}
  node nemotron-cli.js "Explain quantum computing"
  node nemotron-cli.js --stream "Write a Python function"
`);
}

async function chatWithNemotron(prompt) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printBanner();
    printUsage();
    process.exit(0);
  }

  if (!API_KEY) {
    console.error(chalk.red('❌ NVIDIA_API_KEY not found in environment'));
    console.error('Get free key at: https://build.nvidia.com/');
    process.exit(1);
  }

  printBanner();

  const prompt = args.filter((a) => !a.startsWith('--')).join(' ');
  if (!prompt) {
    console.error(chalk.red('❌ No prompt provided'));
    printUsage();
    process.exit(1);
  }

  console.log(chalk.cyan('Prompt:'), prompt, '\n');

  try {
    const response = await chatWithNemotron(prompt);
    console.log(chalk.green('Response:'));
    console.log(response);
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

main();
