#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗   ██╗██╗  ████████╗██████╗  █████╗                 ║
║   ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗                ║
║   ██║   ██║██║     ██║   ██████╔╝███████║                ║
║   ██║   ██║██║     ██║   ██╔══██╗██╔══██║                ║
║   ╚██████╔╝███████╗██║   ██║  ██║██║  ██║                ║
║    ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝                ║
║                                                           ║
║   ██████╗ ███████╗██╗  ██╗                               ║
║   ██╔══██╗██╔════╝╚██╗██╔╝                               ║
║   ██║  ██║█████╗   ╚███╔╝                                ║
║   ██║  ██║██╔══╝   ██╔██╗                                ║
║   ██████╔╝███████╗██╔╝ ██╗                               ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝                               ║
║                                                           ║
║   From Idea to Production-Ready SaaS                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

// Template content (embedded)
const QUICK_START_TEMPLATE = `# {{PROJECT_NAME}} - Quick Start

## 1. Your Idea (2 sentences max)

**What:** {{IDEA_WHAT}}
**For whom:** {{IDEA_FOR}}

## 2. The Problem (3 bullets)

- {{PROBLEM_1}}
- {{PROBLEM_2}}
- {{PROBLEM_3}}

## 3. MVP Features (5 max)

| Feature | Priority | Why it's MVP? |
|---------|----------|---------------|
| {{FEATURE_1}} | P0 | |
| | P0 | |
| | P1 | |
| | P1 | |
| | P2 | |

## 4. Tech Stack

| Layer | Your Choice |
|-------|-------------|
| Frontend | {{FRONTEND}} |
| Database | {{DATABASE}} |
| Auth | {{AUTH}} |
| Payments | {{PAYMENTS}} |
| Hosting | {{HOSTING}} |

## 5. First 3 Tasks

1. [ ] Set up project with chosen stack
2. [ ] Implement core feature #1
3. [ ] Deploy to staging

---

**Next:** Fill out the full implementation plan using the Ultra-Dex template.
`;

const CONTEXT_TEMPLATE = `# {{PROJECT_NAME}} - Context

## Project Overview
**Name:** {{PROJECT_NAME}}
**Started:** {{DATE}}
**Status:** Planning

## Quick Summary
{{IDEA_WHAT}} for {{IDEA_FOR}}.

## Key Decisions
- Frontend: {{FRONTEND}}
- Database: {{DATABASE}}
- Auth: {{AUTH}}
- Payments: {{PAYMENTS}}
- Hosting: {{HOSTING}}

## Current Focus
Setting up the implementation plan.

## Resources
- [Ultra-Dex Template](https://github.com/anthropics/ultra-dex)
- [TaskFlow Example](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
`;

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new Ultra-Dex project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\nWelcome to Ultra-Dex! Let\'s plan your SaaS.\n'));

    // Gather project info
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What\'s your project name?',
        default: options.name || 'my-saas',
        validate: (input) => input.length > 0 || 'Project name is required',
      },
      {
        type: 'input',
        name: 'ideaWhat',
        message: 'What are you building? (1 sentence)',
        validate: (input) => input.length > 0 || 'Please describe your idea',
      },
      {
        type: 'input',
        name: 'ideaFor',
        message: 'Who is it for?',
        validate: (input) => input.length > 0 || 'Please specify your target users',
      },
      {
        type: 'input',
        name: 'problem1',
        message: 'Problem #1 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'problem2',
        message: 'Problem #2 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'problem3',
        message: 'Problem #3 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'feature1',
        message: 'Most important MVP feature:',
        default: '',
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Frontend framework:',
        choices: ['Next.js', 'Remix', 'SvelteKit', 'Nuxt', 'Other'],
      },
      {
        type: 'list',
        name: 'database',
        message: 'Database:',
        choices: ['PostgreSQL', 'Supabase', 'MongoDB', 'PlanetScale', 'Other'],
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Authentication:',
        choices: ['NextAuth', 'Clerk', 'Auth0', 'Supabase Auth', 'Other'],
      },
      {
        type: 'list',
        name: 'payments',
        message: 'Payments:',
        choices: ['Stripe', 'Lemonsqueezy', 'Paddle', 'None (free)', 'Other'],
      },
      {
        type: 'list',
        name: 'hosting',
        message: 'Hosting:',
        choices: ['Vercel', 'Railway', 'Fly.io', 'AWS', 'Other'],
      },
    ]);

    const spinner = ora('Creating project files...').start();

    try {
      const outputDir = path.resolve(options.dir, answers.projectName);

      // Create directories
      await fs.mkdir(outputDir, { recursive: true });
      await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });

      // Replace placeholders
      const replacements = {
        '{{PROJECT_NAME}}': answers.projectName,
        '{{DATE}}': new Date().toISOString().split('T')[0],
        '{{IDEA_WHAT}}': answers.ideaWhat,
        '{{IDEA_FOR}}': answers.ideaFor,
        '{{PROBLEM_1}}': answers.problem1 || 'Problem 1',
        '{{PROBLEM_2}}': answers.problem2 || 'Problem 2',
        '{{PROBLEM_3}}': answers.problem3 || 'Problem 3',
        '{{FEATURE_1}}': answers.feature1 || 'Core feature',
        '{{FRONTEND}}': answers.frontend,
        '{{DATABASE}}': answers.database,
        '{{AUTH}}': answers.auth,
        '{{PAYMENTS}}': answers.payments,
        '{{HOSTING}}': answers.hosting,
      };

      let quickStart = QUICK_START_TEMPLATE;
      let context = CONTEXT_TEMPLATE;

      for (const [key, value] of Object.entries(replacements)) {
        quickStart = quickStart.replace(new RegExp(key, 'g'), value);
        context = context.replace(new RegExp(key, 'g'), value);
      }

      // Write files
      await fs.writeFile(path.join(outputDir, 'QUICK-START.md'), quickStart);
      await fs.writeFile(path.join(outputDir, 'CONTEXT.md'), context);

      // Create empty implementation plan
      const planContent = `# ${answers.projectName} - Implementation Plan

> Generated with Ultra-Dex CLI

## Overview

${answers.ideaWhat} for ${answers.ideaFor}.

---

## Next Steps

1. Open QUICK-START.md and complete the remaining sections
2. Copy sections from the full Ultra-Dex template as needed
3. Use the TaskFlow example as reference
4. Start building!

## Resources

- [Full Template](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Imp%20Template.md)
- [TaskFlow Example](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
- [Methodology](https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/METHODOLOGY.md)
`;

      await fs.writeFile(path.join(outputDir, 'IMPLEMENTATION-PLAN.md'), planContent);

      spinner.succeed(chalk.green('Project created successfully!'));

      console.log('\n' + chalk.bold('Files created:'));
      console.log(chalk.gray(`  ${outputDir}/`));
      console.log(chalk.gray('  ├── QUICK-START.md'));
      console.log(chalk.gray('  ├── CONTEXT.md'));
      console.log(chalk.gray('  └── IMPLEMENTATION-PLAN.md'));

      console.log('\n' + chalk.bold('Next steps:'));
      console.log(chalk.cyan(`  1. cd ${answers.projectName}`));
      console.log(chalk.cyan('  2. Open QUICK-START.md and complete it'));
      console.log(chalk.cyan('  3. Start building! 🚀'));

      console.log('\n' + chalk.gray('Need the full template? Visit:'));
      console.log(chalk.blue('  https://github.com/anthropics/ultra-dex'));

    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('examples')
  .description('List available examples')
  .action(() => {
    console.log(chalk.bold('\nAvailable Ultra-Dex Examples:\n'));

    const examples = [
      {
        name: 'TaskFlow',
        type: 'Task Management',
        url: 'https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md',
      },
      {
        name: 'InvoiceFlow',
        type: 'Invoicing',
        url: 'https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/InvoiceFlow-Complete.md',
      },
      {
        name: 'HabitStack',
        type: 'Habit Tracking',
        url: 'https://github.com/anthropics/ultra-dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/HabitStack-Complete.md',
      },
    ];

    examples.forEach((ex, i) => {
      console.log(chalk.cyan(`${i + 1}. ${ex.name}`) + chalk.gray(` (${ex.type})`));
      console.log(chalk.gray(`   ${ex.url}\n`));
    });
  });

program.parse();
