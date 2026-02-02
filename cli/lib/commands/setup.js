#!/usr/bin/env node

/**
 * ultra-dex setup command
 * Interactive configuration wizard for first-time users
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const program = new Command();

program
  .name('ultra-dex setup')
  .description('Interactive setup wizard for Ultra-Dex')
  .version('1.0.0');

program
  .option('--quick', 'Quick setup with defaults')
  .option('--reset', 'Reset configuration to defaults')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n⚡ Ultra-Dex Setup Wizard\n'));
      
      if (options.reset) {
        await resetConfig();
        console.log(chalk.green('✅ Configuration reset to defaults\n'));
        return;
      }
      
      if (options.quick) {
        await quickSetup();
        console.log(chalk.green('✅ Quick setup complete!\n'));
        console.log(chalk.gray('Run `ultra-dex setup` for full configuration.\n'));
        return;
      }
      
      // Full interactive setup
      console.log(chalk.blue('Welcome! Let\'s configure Ultra-Dex for your workflow.\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'primaryProvider',
          message: 'Choose your primary AI provider:',
          choices: [
            { name: 'Anthropic (Claude) - Recommended', value: 'anthropic' },
            { name: 'OpenAI (GPT-4)', value: 'openai' },
            { name: 'Google (Gemini)', value: 'google' },
            { name: 'Local/Ollama (Free, self-hosted)', value: 'ollama' }
          ],
          default: 'anthropic'
        },
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your API key (or leave blank to set later):',
          when: (answers) => answers.primaryProvider !== 'ollama'
        },
        {
          type: 'input',
          name: 'ollamaUrl',
          message: 'Ollama server URL:',
          default: 'http://localhost:11434',
          when: (answers) => answers.primaryProvider === 'ollama'
        },
        {
          type: 'list',
          name: 'defaultTemplate',
          message: 'Default implementation template:',
          choices: [
            { name: 'LITE (12 sections) - Quick MVPs', value: 'lite' },
            { name: 'FULL (34 sections) - Complete projects', value: 'full' },
            { name: 'ENTERPRISE (50+ sections) - Large scale', value: 'enterprise' }
          ],
          default: 'lite'
        },
        {
          type: 'confirm',
          name: 'autoStartKernel',
          message: 'Auto-start kernel when opening VS Code?',
          default: false
        },
        {
          type: 'confirm',
          name: 'enableSandbox',
          message: 'Enable Docker sandbox for code execution?',
          default: true
        },
        {
          type: 'input',
          name: 'dashboardPort',
          message: 'Dashboard port:',
          default: '3002',
          validate: (input) => {
            const port = parseInt(input);
            return port > 1024 && port < 65535 ? true : 'Port must be between 1025-65534';
          }
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Enable additional features:',
          choices: [
            { name: 'Auto-sync on file save', value: 'autoSync', checked: true },
            { name: 'Slack notifications', value: 'slack' },
            { name: 'GitHub integration', value: 'github' },
            { name: 'Analytics tracking', value: 'analytics' }
          ]
        },
        {
          type: 'confirm',
          name: 'installCompletions',
          message: 'Install shell completions (bash/zsh)?',
          default: true
        }
      ]);
      
      // Save configuration
      const config = {
        version: '1.0.0',
        primaryProvider: answers.primaryProvider,
        defaultTemplate: answers.defaultTemplate,
        dashboardPort: parseInt(answers.dashboardPort),
        autoStartKernel: answers.autoStartKernel,
        enableSandbox: answers.enableSandbox,
        features: answers.features,
        createdAt: new Date().toISOString()
      };
      
      if (answers.apiKey) {
        config.apiKey = answers.apiKey;
      }
      
      if (answers.ollamaUrl) {
        config.ollamaUrl = answers.ollamaUrl;
      }
      
      await saveConfig(config);
      
      // Install completions if requested
      if (answers.installCompletions) {
        await installCompletions();
      }
      
      console.log(chalk.green.bold('\n✅ Setup Complete!\n'));
      
      // Show next steps
      console.log(chalk.cyan('Next Steps:'));
      console.log(chalk.white('  1. Run `npx ultra-dex init` to create your first project'));
      console.log(chalk.white('  2. Run `npx ultra-dex generate "Your idea"` for a plan'));
      console.log(chalk.white('  3. Run `npx ultra-dex dashboard` to open the dashboard'));
      console.log(chalk.white('  4. Install VS Code extension for sidebar integration'));
      console.log();
      
      console.log(chalk.gray('Configuration saved to: ~/.ultra-dex/config.json\n'));
      console.log(chalk.gray('Edit anytime with: `npx ultra-dex config`\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

async function quickSetup() {
  const config = {
    version: '1.0.0',
    primaryProvider: 'anthropic',
    defaultTemplate: 'lite',
    dashboardPort: 3002,
    autoStartKernel: false,
    enableSandbox: true,
    features: ['autoSync'],
    createdAt: new Date().toISOString()
  };
  
  await saveConfig(config);
}

async function resetConfig() {
  const configPath = path.join(os.homedir(), '.ultra-dex', 'config.json');
  try {
    await fs.unlink(configPath);
  } catch (e) {
    // File might not exist
  }
}

async function saveConfig(config) {
  const configDir = path.join(os.homedir(), '.ultra-dex');
  const configPath = path.join(configDir, 'config.json');
  
  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

async function installCompletions() {
  const shell = process.env.SHELL;
  
  if (shell && shell.includes('zsh')) {
    const zshCompletionDir = path.join(os.homedir(), '.zsh', 'completions');
    const sourceFile = path.join(__dirname, '..', 'completions', '_ultra-dex');
    const targetFile = path.join(zshCompletionDir, '_ultra-dex');
    
    try {
      await fs.mkdir(zshCompletionDir, { recursive: true });
      await fs.copyFile(sourceFile, targetFile);
      console.log(chalk.green('✅ Zsh completions installed'));
      console.log(chalk.gray('   Add to ~/.zshrc: fpath+=~/.zsh/completions'));
    } catch (e) {
      console.log(chalk.yellow('⚠️  Could not install zsh completions'));
    }
  } else if (shell && shell.includes('bash')) {
    const bashrc = path.join(os.homedir(), '.bashrc');
    const sourceFile = path.join(__dirname, '..', 'completions', 'ultra-dex.bash');
    
    try {
      const completionLine = `source ${sourceFile}`;
      const bashrcContent = await fs.readFile(bashrc, 'utf8');
      
      if (!bashrcContent.includes(completionLine)) {
        await fs.appendFile(bashrc, `\n# Ultra-Dex completions\n${completionLine}\n`);
        console.log(chalk.green('✅ Bash completions installed'));
        console.log(chalk.gray('   Restart your shell or run: source ~/.bashrc'));
      } else {
        console.log(chalk.gray('ℹ️  Bash completions already installed'));
      }
    } catch (e) {
      console.log(chalk.yellow('⚠️  Could not install bash completions'));
    }
  } else {
    console.log(chalk.yellow('⚠️  Unknown shell. Completions not installed.'));
    console.log(chalk.gray('   Manual install: see completions/ directory'));
  }
}

program.parse();
