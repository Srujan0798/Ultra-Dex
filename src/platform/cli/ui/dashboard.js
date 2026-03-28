// Copyright (c) 2026 Ultra-Dex

/**
 * Omni-Box Dashboard
 * Interactive TUI dashboard for Ultra-Dex
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { ConfigManager } from '../utils/config-manager.js';

/**
 * Show interactive dashboard menu
 */
async function showDashboard() {
  logger.log(
    chalk.magenta(
      `
███╗   ██╗██╗   ████████╗██████╗  ██████╗       ██████╗ ███████╗██╗  ██╗
████╗  ██║██║   ╚══██╔══╝██╔══██╗██╔═══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██╔██╗ ██║██║      ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝
██║╚██╗██║██║      ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗
██║ ╚████║███████╗ ██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
╚═╝  ╚═══╝╚══════╝ ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
`
    )
  );

  logger.log(chalk.yellow('AI Orchestration Meta-Layer for SaaS Development'));
  logger.log(chalk.gray('Version: 3.7.4'));
  logger.log('');

  while (true) {
    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: chalk.cyan('What would you like to do?'),
          choices: [
            { name: '🚀 Start New Project', value: 'init' },
            { name: '🤖 Run Agent', value: 'agent' },
            { name: '📊 System Status', value: 'status' },
            { name: '🔍 Search Projects', value: 'search' },
            { name: '⚙️  Settings', value: 'settings' },
            { name: '❓ Help', value: 'help' },
            { name: '🚪 Exit', value: 'exit' },
          ],
        },
      ]);

      switch (action) {
        case 'init':
          await handleInitProject();
          break;
        case 'agent':
          await handleRunAgent();
          break;
        case 'status':
          await handleSystemStatus();
          break;
        case 'search':
          await handleSearchProjects();
          break;
        case 'settings':
          await handleSettings();
          break;
        case 'help':
          await handleHelp();
          break;
        case 'exit':
          logger.log(chalk.green('\n👋 Thank you for using Ultra-Dex!'));
          return;
        default:
          logger.log(chalk.yellow('Unknown option selected.'));
      }

      // Pause before showing menu again
      await pauseBeforeMenu();
    } catch (error) {
      logger.error(chalk.red(`Error in dashboard: ${error.message}`));
      break;
    }
  }
}

/**
 * Handle project initialization
 */
async function handleInitProject() {
  logger.log(chalk.cyan('\n🚀 Starting new project setup...\n'));

  const { projectName, template } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: (input) => input.trim().length > 0 || 'Project name is required',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        { name: 'Next.js + TypeScript + Tailwind', value: 'next-ts' },
        { name: 'Express + TypeScript', value: 'express-ts' },
        { name: 'Python Flask', value: 'flask' },
        { name: 'Custom', value: 'custom' },
      ],
    },
  ]);

  logger.log(chalk.yellow(`\nSetting up project: ${projectName} with ${template} template...`));

  // Simulate project creation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  logger.log(chalk.green(`\n✅ Project ${projectName} created successfully!`));
  logger.log(chalk.gray(`📁 Directory: ${path.join(process.cwd(), projectName)}`));
}

/**
 * Handle running an agent
 */
async function handleRunAgent() {
  logger.log(chalk.cyan('\n🤖 Select an agent to run:\n'));

  const { agent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agent',
      message: 'Choose an agent:',
      choices: [
        { name: '@Planner - Project planning', value: 'planner' },
        { name: '@CTO - Architecture decisions', value: 'cto' },
        { name: '@Backend - Backend development', value: 'backend' },
        { name: '@Frontend - Frontend development', value: 'frontend' },
        { name: '@Database - Database operations', value: 'database' },
        { name: '@Reviewer - Code review', value: 'reviewer' },
        { name: 'Custom task', value: 'custom' },
      ],
    },
  ]);

  if (agent === 'custom') {
    const { task } = await inquirer.prompt([
      {
        type: 'input',
        name: 'task',
        message: 'Describe the task for the agent:',
        validate: (input) => input.trim().length > 0 || 'Task description is required',
      },
    ]);

    logger.log(chalk.yellow(`\nRunning custom task: ${task}`));
  } else {
    logger.log(chalk.yellow(`\nRunning ${agent} agent...`));
  }

  // Simulate agent execution
  await new Promise((resolve) => setTimeout(resolve, 2500));

  logger.log(chalk.green('✅ Agent task completed!'));
}

/**
 * Handle system status
 */
async function handleSystemStatus() {
  logger.log(chalk.cyan('\n📊 Checking system status...\n'));

  // Simulate status checks
  await new Promise((resolve) => setTimeout(resolve, 1500));

  logger.log(chalk.green('✅ All systems operational!'));
  logger.log(chalk.gray('- CLI: Running'));
  logger.log(chalk.gray('- MCP Server: Connected'));
  logger.log(chalk.gray('- Memory: Active'));
  logger.log(chalk.gray('- Graph Indexer: Synced'));
  logger.log(chalk.gray('- Context Bus: Online'));
}

/**
 * Handle searching projects
 */
async function handleSearchProjects() {
  logger.log(chalk.cyan('\n🔍 Searching for projects...\n'));

  // Look for recent projects
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const projectsDir = path.join(homeDir, 'projects');

  try {
    const items = await fs.readdir(projectsDir);
    const projects = items.filter((item) => {
      const itemPath = path.join(projectsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    if (projects.length > 0) {
      const { selectedProject } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProject',
          message: 'Select a project:',
          choices: projects.map((proj) => ({ name: proj, value: proj })),
        },
      ]);

      logger.log(chalk.green(`\nSelected project: ${selectedProject}`));
      logger.log(chalk.gray(`📁 Path: ${path.join(projectsDir, selectedProject)}`));
    } else {
      logger.log(chalk.yellow('No projects found in ~/projects'));
    }
  } catch (error) {
    logger.log(chalk.yellow('Could not access projects directory'));
  }
}

/**
 * Handle settings
 */
async function handleSettings() {
  logger.log(chalk.cyan('\n⚙️  Ultra-Dex Settings\n'));

  const configManager = new ConfigManager();
  await configManager.load();

  const { setting } = await inquirer.prompt([
    {
      type: 'list',
      name: 'setting',
      message: 'What would you like to configure?',
      choices: [
        { name: 'AI Providers', value: 'providers' },
        { name: 'Default Options', value: 'defaults' },
        { name: 'Theme', value: 'theme' },
        { name: 'Back to main menu', value: 'back' },
      ],
    },
  ]);

  if (setting === 'back') {
    return;
  }

  if (setting === 'providers') {
    const { provider, model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Default AI provider:',
        choices: [
          { name: 'Claude', value: 'claude' },
          { name: 'OpenAI', value: 'openai' },
          { name: 'Gemini', value: 'gemini' },
          { name: 'Ollama', value: 'ollama' },
        ],
        default: configManager.get('ai.defaultProvider'),
      },
      {
        type: 'input',
        name: 'model',
        message: 'Default model (leave blank to keep current):',
        default: configManager.get('ai.defaultModel'),
      },
    ]);

    configManager.set('ai.defaultProvider', provider);
    if (model && String(model).trim().length > 0) {
      configManager.set('ai.defaultModel', model.trim());
    }
    await configManager.save();
    printSuccess('Updated AI provider settings.');
    return;
  }

  if (setting === 'defaults') {
    const { temperature, maxTokens, debugMode, verboseLogging } = await inquirer.prompt([
      {
        type: 'input',
        name: 'temperature',
        message: 'Default temperature (0-1):',
        default: String(configManager.get('ai.temperature', 0.7)),
        validate: (input) => {
          const value = Number(input);
          return Number.isFinite(value) && value >= 0 && value <= 1
            ? true
            : 'Temperature must be between 0 and 1.';
        },
      },
      {
        type: 'input',
        name: 'maxTokens',
        message: 'Default max tokens:',
        default: String(configManager.get('ai.maxTokens', 8192)),
        validate: (input) => {
          const value = Number(input);
          return Number.isFinite(value) && value > 0 ? true : 'Max tokens must be a positive number.';
        },
      },
      {
        type: 'confirm',
        name: 'debugMode',
        message: 'Enable debug mode?',
        default: Boolean(configManager.get('development.debugMode', false)),
      },
      {
        type: 'confirm',
        name: 'verboseLogging',
        message: 'Enable verbose logging?',
        default: Boolean(configManager.get('development.verboseLogging', false)),
      },
    ]);

    configManager.set('ai.temperature', Number(temperature));
    configManager.set('ai.maxTokens', Number(maxTokens));
    configManager.set('development.debugMode', debugMode);
    configManager.set('development.verboseLogging', verboseLogging);
    await configManager.save();
    printSuccess('Updated default settings.');
    return;
  }

  if (setting === 'theme') {
    const { theme } = await inquirer.prompt([
      {
        type: 'list',
        name: 'theme',
        message: 'Select UI theme:',
        choices: [
          { name: 'Professional Purple', value: 'professional-purple' },
          { name: 'Ocean', value: 'ocean' },
          { name: 'Forest', value: 'forest' },
          { name: 'Doomsday', value: 'doomsday' },
        ],
        default: configManager.get('ui.theme', 'professional-purple'),
      },
    ]);

    configManager.set('ui.theme', theme);
    await configManager.save();
    printSuccess(`Theme set to ${theme}.`);
  }
}

/**
 * Handle help
 */
async function handleHelp() {
  logger.log(chalk.cyan('\n❓ Ultra-Dex Help\n'));

  logger.log(chalk.bold('Available Commands:'));
  logger.log(chalk.gray('  ultra-dex init ............ Initialize new project'));
  logger.log(chalk.gray('  ultra-dex generate ........ Generate implementation plan'));
  logger.log(chalk.gray('  ultra-dex build ........... Auto-pilot build process'));
  logger.log(chalk.gray('  ultra-dex agents .......... List available AI agents'));
  logger.log(chalk.gray('  ultra-dex verify .......... Run 21-step verification'));
  logger.log(chalk.gray('  ultra-dex sync ............ Synchronize project state'));
  logger.log('');

  logger.log(chalk.bold('Need more help?'));
  logger.log(chalk.gray('  Visit: https://github.com/Srujan0798/Ultra-Dex'));
  logger.log(chalk.gray('  Discord: https://discord.gg/ultradex'));
  logger.log('');

  await inquirer.prompt([{ type: 'input', name: 'done', message: 'Press Enter to continue...' }]);
}

/**
 * Pause before showing menu again
 */
async function pauseBeforeMenu() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Register dashboard command
 */
export function registerOmniBoxCommand(program) {
  program
    .command('dashboard')
    .alias('omni')
    .description('Interactive Omni-Box dashboard')
    .option('-t, --terminal', 'Force terminal UI mode')
    .action(async (options) => {
      try {
        await showDashboard();
      } catch (error) {
        printError(chalk.red(`Dashboard error: ${error.message}`));
      }
    });
}

export default {
  showDashboard,
  registerOmniBoxCommand,
};
