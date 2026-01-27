/**
 * ultra-dex build command
 * Auto-loads context and starts AI-assisted development
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Agent configurations
const AGENTS = {
  planner: { name: '@Planner', tier: 'Leadership', task: 'Break down features into atomic tasks' },
  cto: { name: '@CTO', tier: 'Leadership', task: 'Architecture decisions' },
  backend: { name: '@Backend', tier: 'Development', task: 'API endpoints and business logic' },
  frontend: { name: '@Frontend', tier: 'Development', task: 'UI components and pages' },
  database: { name: '@Database', tier: 'Development', task: 'Schema design and migrations' },
  auth: { name: '@Auth', tier: 'Security', task: 'Authentication and authorization' },
  security: { name: '@Security', tier: 'Security', task: 'Security audit' },
  testing: { name: '@Testing', tier: 'Quality', task: 'Write and run tests' },
  reviewer: { name: '@Reviewer', tier: 'Quality', task: 'Code review' },
  devops: { name: '@DevOps', tier: 'DevOps', task: 'Deployment and CI/CD' },
};

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function registerBuildCommand(program) {
  program
    .command('build')
    .description('Start AI-assisted development with auto-loaded context')
    .option('-a, --agent <agent>', 'Agent to use (planner, backend, frontend, etc.)')
    .option('-t, --task <task>', 'Specific task to work on')
    .option('--copy', 'Copy prompt to clipboard instead of displaying')
    .option('--cursor', 'Open in Cursor IDE')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔧 Ultra-Dex Build Mode\n'));

      // Check for required files
      const hasContext = await fileExists('CONTEXT.md');
      const hasPlan = await fileExists('IMPLEMENTATION-PLAN.md');
      const hasQuickStart = await fileExists('QUICK-START.md');

      if (!hasContext && !hasPlan) {
        console.log(chalk.yellow('⚠️  No Ultra-Dex project found in current directory.\n'));
        console.log(chalk.white('Run one of these first:'));
        console.log(chalk.gray('  npx ultra-dex init      # Create from template'));
        console.log(chalk.gray('  npx ultra-dex generate  # Generate from idea\n'));
        return;
      }

      // Load context files
      const spinner = ora('Loading project context...').start();

      const context = await readFileSafe('CONTEXT.md');
      const plan = await readFileSafe('IMPLEMENTATION-PLAN.md');
      const quickStart = await readFileSafe('QUICK-START.md');

      spinner.succeed('Context loaded');

      // Select agent if not provided
      let agent = options.agent;
      if (!agent) {
        const { selectedAgent } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedAgent',
            message: 'Select an agent:',
            choices: [
              new inquirer.Separator('── Leadership ──'),
              { name: '📋 @Planner - Break down tasks', value: 'planner' },
              { name: '🏗️  @CTO - Architecture decisions', value: 'cto' },
              new inquirer.Separator('── Development ──'),
              { name: '⚙️  @Backend - API endpoints', value: 'backend' },
              { name: '🎨 @Frontend - UI components', value: 'frontend' },
              { name: '🗄️  @Database - Schema design', value: 'database' },
              new inquirer.Separator('── Security ──'),
              { name: '🔐 @Auth - Authentication', value: 'auth' },
              { name: '🛡️  @Security - Security audit', value: 'security' },
              new inquirer.Separator('── Quality ──'),
              { name: '🧪 @Testing - Write tests', value: 'testing' },
              { name: '👁️  @Reviewer - Code review', value: 'reviewer' },
              new inquirer.Separator('── DevOps ──'),
              { name: '🚀 @DevOps - Deployment', value: 'devops' },
            ],
          },
        ]);
        agent = selectedAgent;
      }

      const agentConfig = AGENTS[agent];
      if (!agentConfig) {
        console.log(chalk.red(`Unknown agent: ${agent}`));
        console.log(chalk.gray(`Available: ${Object.keys(AGENTS).join(', ')}`));
        return;
      }

      // Get task if not provided
      let task = options.task;
      if (!task) {
        const { taskInput } = await inquirer.prompt([
          {
            type: 'input',
            name: 'taskInput',
            message: `What should ${agentConfig.name} do?`,
            default: agentConfig.task,
          },
        ]);
        task = taskInput;
      }

      // Build the prompt
      const contextSection = context ? `## Project Context\n${context}\n` : '';
      const planSection = plan ? `## Implementation Plan (Summary)\n${plan.slice(0, 8000)}...\n[Full plan in IMPLEMENTATION-PLAN.md]\n` : '';

      const prompt = `# ${agentConfig.name} Agent Session

You are acting as ${agentConfig.name} for this project.

${contextSection}
${planSection}

## Your Task
${task}

## Instructions
1. Read the context and plan carefully
2. Focus ONLY on your assigned task
3. Follow Ultra-Dex 21-step verification for any code changes
4. Document your work in a way the next agent can continue

## Output Format
- For code: Include full file paths and production-ready code
- For plans: Use atomic tasks (4-9 hours each)
- For reviews: Use severity levels (critical, warning, info)

Begin working on: ${task}
`;

      // Output the prompt
      console.log(chalk.green(`\n✅ ${agentConfig.name} prompt ready\n`));

      if (options.copy) {
        // Copy to clipboard
        try {
          const platform = process.platform;
          if (platform === 'darwin') {
            await execAsync(`echo ${JSON.stringify(prompt)} | pbcopy`);
          } else if (platform === 'linux') {
            await execAsync(`echo ${JSON.stringify(prompt)} | xclip -selection clipboard`);
          } else if (platform === 'win32') {
            await execAsync(`echo ${JSON.stringify(prompt)} | clip`);
          }
          console.log(chalk.cyan('📋 Prompt copied to clipboard!'));
          console.log(chalk.gray('Paste into your AI tool (Cursor, Claude, ChatGPT)\n'));
        } catch {
          console.log(chalk.yellow('Could not copy to clipboard. Displaying prompt instead:\n'));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(prompt);
          console.log(chalk.gray('─'.repeat(60)));
        }
      } else if (options.cursor) {
        // Save prompt and open Cursor
        const promptPath = path.join('.ultra-dex', 'current-prompt.md');
        await fs.mkdir('.ultra-dex', { recursive: true });
        await fs.writeFile(promptPath, prompt);

        console.log(chalk.gray(`Prompt saved to: ${promptPath}`));
        console.log(chalk.cyan('Opening Cursor...\n'));

        try {
          await execAsync('cursor .');
        } catch {
          console.log(chalk.yellow('Could not open Cursor. Is it installed?'));
          console.log(chalk.gray('Install: https://cursor.sh'));
        }
      } else {
        // Display the prompt
        console.log(chalk.gray('─'.repeat(60)));
        console.log(prompt);
        console.log(chalk.gray('─'.repeat(60)));

        console.log(chalk.cyan('\n📋 Copy this prompt into your AI tool'));
        console.log(chalk.gray('Or use --copy to copy to clipboard\n'));
      }

      // Show next steps
      console.log(chalk.white('Tips:'));
      console.log(chalk.gray('  • Paste the prompt into Cursor, Claude, or ChatGPT'));
      console.log(chalk.gray('  • Use "npx ultra-dex serve" for MCP-compatible context'));
      console.log(chalk.gray('  • Run "npx ultra-dex review" after making changes\n'));
    });
}

export default { registerBuildCommand };
