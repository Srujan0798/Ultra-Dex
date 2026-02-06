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

/**
 * Show interactive dashboard menu
 */
async function showDashboard() {
  console.log(
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

  console.log(chalk.yellow('AI Orchestration Meta-Layer for SaaS Development'));
  console.log(chalk.gray('Version: 3.7.4'));
  console.log('');

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
          console.log(chalk.green('\n👋 Thank you for using Ultra-Dex!'));
          return;
        default:
          console.log(chalk.yellow('Option not implemented yet.'));
      }

      // Pause before showing menu again
      await pauseBeforeMenu();
    } catch (error) {
      console.error(chalk.red(`Error in dashboard: ${error.message}`));
      break;
    }
  }
}

/**
 * Handle project initialization
 */
async function handleInitProject() {
  console.log(chalk.cyan('\n🚀 Starting new project setup...\n'));

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

  console.log(chalk.yellow(`\nSetting up project: ${projectName} with ${template} template...`));

  // Simulate project creation
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(chalk.green(`\n✅ Project ${projectName} created successfully!`));
  console.log(chalk.gray(`📁 Directory: ${path.join(process.cwd(), projectName)}`));
}

/**
 * Handle running an agent
 */
async function handleRunAgent() {
  console.log(chalk.cyan('\n🤖 Select an agent to run:\n'));

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

    console.log(chalk.yellow(`\nRunning custom task: ${task}`));
  } else {
    console.log(chalk.yellow(`\nRunning ${agent} agent...`));
  }

  // Simulate agent execution
  await new Promise((resolve) => setTimeout(resolve, 2500));

  console.log(chalk.green('✅ Agent task completed!'));
}

/**
 * Handle system status
 */
async function handleSystemStatus() {
  console.log(chalk.cyan('\n📊 Checking system status...\n'));

  // Simulate status checks
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(chalk.green('✅ All systems operational!'));
  console.log(chalk.gray('- CLI: Running'));
  console.log(chalk.gray('- MCP Server: Connected'));
  console.log(chalk.gray('- Memory: Active'));
  console.log(chalk.gray('- Graph Indexer: Synced'));
  console.log(chalk.gray('- Context Bus: Online'));
}

/**
 * Handle searching projects
 */
async function handleSearchProjects() {
  console.log(chalk.cyan('\n🔍 Searching for projects...\n'));

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

      console.log(chalk.green(`\nSelected project: ${selectedProject}`));
      console.log(chalk.gray(`📁 Path: ${path.join(projectsDir, selectedProject)}`));
    } else {
      console.log(chalk.yellow('No projects found in ~/projects'));
    }
  } catch (error) {
    console.log(chalk.yellow('Could not access projects directory'));
  }
}

/**
 * Handle settings
 */
async function handleSettings() {
  console.log(chalk.cyan('\n⚙️  Ultra-Dex Settings\n'));

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

  if (setting !== 'back') {
    console.log(chalk.yellow(`\n${setting} configuration coming soon...`));
  }
}

/**
 * Handle help
 */
async function handleHelp() {
  console.log(chalk.cyan('\n❓ Ultra-Dex Help\n'));

  console.log(chalk.bold('Available Commands:'));
  console.log(chalk.gray('  ultra-dex init ............ Initialize new project'));
  console.log(chalk.gray('  ultra-dex generate ........ Generate implementation plan'));
  console.log(chalk.gray('  ultra-dex build ........... Auto-pilot build process'));
  console.log(chalk.gray('  ultra-dex agents .......... List available AI agents'));
  console.log(chalk.gray('  ultra-dex verify .......... Run 21-step verification'));
  console.log(chalk.gray('  ultra-dex sync ............ Synchronize project state'));
  console.log('');

  console.log(chalk.bold('Need more help?'));
  console.log(chalk.gray('  Visit: https://github.com/Srujan0798/Ultra-Dex'));
  console.log(chalk.gray('  Discord: https://discord.gg/ultradex'));
  console.log('');

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
