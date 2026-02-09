#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex setup command
 * Interactive configuration wizard for first-time users
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Register the setup command with Commander
 * @param {Command} program - Commander program instance
 * @returns {void}
 */
export function registerSetupCommand(program) {
  program
    .command('setup')
    .description('Interactive setup wizard for Ultra-Dex')
    .option('--quick', 'Quick setup with defaults')
    .option('--reset', 'Reset configuration to defaults')
    .option('--completions', 'Install shell completions and exit')
    .action(async (options) => {
      try {
        await runSetup(options);
      } catch (error) {
        printError(chalk.red('\n❌ Setup failed:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Run the interactive setup wizard
 * @param {Object} options - Command options
 * @param {boolean} [options.quick] - Quick setup flag
 * @param {boolean} [options.reset] - Reset config flag
 * @param {boolean} [options.completions] - Install completions flag
 * @returns {Promise<void>}
 */
async function runSetup(options) {
  printInfo(chalk.cyan.bold('\n⚡ Ultra-Dex Setup Wizard\n'));

  if (options.completions) {
    await installCompletions();
    printSuccess(chalk.green('✅ Shell completions installed\n'));
    return;
  }

  if (options.reset) {
    await resetConfig();
    printSuccess(chalk.green('✅ Configuration reset to defaults\n'));
    return;
  }

  if (options.quick) {
    await quickSetup();
    printSuccess(chalk.green('✅ Quick setup complete!\n'));
    printInfo(chalk.gray('Run `ultra-dex setup` for full configuration.\n'));
    return;
  }

  // Full interactive setup
  printInfo(chalk.blue("Welcome! Let's configure Ultra-Dex for your workflow.\n"));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'primaryProvider',
      message: 'Choose your primary AI provider:',
      choices: [
        { name: 'Anthropic (Claude) - Recommended', value: 'anthropic' },
        { name: 'OpenAI (GPT-4)', value: 'openai' },
        { name: 'Google (Gemini)', value: 'google' },
        { name: 'Local/Ollama (Free, self-hosted)', value: 'ollama' },
      ],
      default: 'anthropic',
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your API key (or leave blank to set later):',
      when: (answers) => answers.primaryProvider !== 'ollama',
    },
    {
      type: 'input',
      name: 'ollamaUrl',
      message: 'Ollama server URL:',
      default: 'http://localhost:11434',
      when: (answers) => answers.primaryProvider === 'ollama',
    },
    {
      type: 'list',
      name: 'defaultTemplate',
      message: 'Default implementation template:',
      choices: [
        { name: 'LITE (12 sections) - Quick MVPs', value: 'lite' },
        { name: 'FULL (34 sections) - Complete projects', value: 'full' },
        { name: 'ENTERPRISE (50+ sections) - Large scale', value: 'enterprise' },
      ],
      default: 'lite',
    },
    {
      type: 'confirm',
      name: 'vscodeAutoStart',
      message: 'Auto-start Ultra-Dex kernel when opening VS Code?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'enableSandbox',
      message: 'Enable Docker sandbox for code execution?',
      default: true,
    },
    {
      type: 'input',
      name: 'dashboardPort',
      message: 'Dashboard port:',
      default: '3002',
      validate: (input) => {
        const port = parseInt(input, 10);
        return Number.isInteger(port) && port > 1024 && port < 65535
          ? true
          : 'Port must be between 1025-65534';
      },
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Enable additional features:',
      choices: [
        { name: 'Auto-sync on file save', value: 'autoSync', checked: true },
        { name: 'Slack notifications', value: 'slack' },
        { name: 'GitHub integration', value: 'github' },
        { name: 'Analytics tracking', value: 'analytics' },
      ],
    },
    {
      type: 'confirm',
      name: 'installCompletions',
      message: 'Install shell completions (bash/zsh)?',
      default: true,
    },
  ]);

  const config = {
    version: '1.0.0',
    primaryProvider: answers.primaryProvider,
    defaultTemplate: answers.defaultTemplate,
    dashboardPort: parseInt(answers.dashboardPort, 10),
    enableSandbox: answers.enableSandbox,
    features: answers.features,
    vscode: {
      autoStart: answers.vscodeAutoStart,
    },
    createdAt: new Date().toISOString(),
  };

  if (answers.apiKey) {
    config.apiKey = answers.apiKey;
  }

  if (answers.ollamaUrl) {
    config.ollamaUrl = answers.ollamaUrl;
  }

  await saveConfig(config);

  if (answers.installCompletions) {
    await installCompletions();
  }

  printSuccess(chalk.green.bold('\n✅ Setup Complete!\n'));

  printInfo(chalk.cyan('Next Steps:'));
  printInfo(chalk.white('  1. Run `npx ultra-dex init` to create your first project'));
  printInfo(chalk.white('  2. Run `npx ultra-dex generate "Your idea"` for a plan'));
  printInfo(chalk.white('  3. Run `npx ultra-dex dashboard` to open the dashboard'));
  printInfo(chalk.white('  4. Install the VS Code extension for sidebar integration'));
  printInfo('');

  printInfo(chalk.gray('Configuration saved to: ~/.ultra-dex/config.json\n'));
  printInfo(chalk.gray('Edit anytime with: `npx ultra-dex config`\n'));
}

async function quickSetup() {
  const config = {
    version: '1.0.0',
    primaryProvider: 'anthropic',
    defaultTemplate: 'lite',
    dashboardPort: 3002,
    enableSandbox: true,
    features: ['autoSync'],
    vscode: {
      autoStart: false,
    },
    createdAt: new Date().toISOString(),
  };

  await saveConfig(config);
}

async function resetConfig() {
  const configPath = path.join(os.homedir(), '.ultra-dex', 'config.json');
  try {
    await fs.unlink(configPath);
  } catch {
    // File might not exist
  }
}

/**
 * Save configuration to disk
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
async function saveConfig(config) {
  const configDir = path.join(os.homedir(), '.ultra-dex');
  const configPath = path.join(configDir, 'config.json');

  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function installCompletions() {
  const shell = process.env.SHELL || '';
  const completionsDir = path.join(CLI_ROOT, 'completions');

  if (shell.includes('zsh')) {
    const targetDir = path.join(os.homedir(), '.zsh', 'completions');
    const sourceFile = path.join(completionsDir, '_ultra-dex');
    const targetFile = path.join(targetDir, '_ultra-dex');

    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
      printSuccess(chalk.green('✅ Zsh completions installed'));
      printInfo(chalk.gray('   Add to ~/.zshrc: fpath+=~/.zsh/completions'));
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not install zsh completions: ${error.message}`));
    }
    return;
  }

  if (shell.includes('fish')) {
    const targetDir = path.join(os.homedir(), '.config', 'fish', 'completions');
    const sourceFile = path.join(completionsDir, 'ultra-dex.fish');
    const targetFile = path.join(targetDir, 'ultra-dex.fish');

    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
      printSuccess(chalk.green('✅ Fish completions installed'));
      printInfo(chalk.gray('   Reload fish or run: source ~/.config/fish/config.fish'));
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not install fish completions: ${error.message}`));
    }
    return;
  }

  if (shell.includes('bash')) {
    const targetDir = path.join(os.homedir(), '.bash_completion.d');
    const sourceFile = path.join(completionsDir, 'ultra-dex.bash');
    const targetFile = path.join(targetDir, 'ultra-dex');

    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
      printSuccess(chalk.green('✅ Bash completions installed'));
      printInfo(chalk.gray('   Add to ~/.bashrc: source ~/.bash_completion.d/ultra-dex'));
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not install bash completions: ${error.message}`));
    }
    return;
  }

  printWarning(chalk.yellow('⚠️  Unknown shell. Completions not installed.'));
  printInfo(chalk.gray('   Manual install: see completions/ directory'));
}
