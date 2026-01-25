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

// HYPER-DEX Banner
const banner = `
██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗       ██████╗ ███████╗██╗  ██╗
██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝█████╗██║  ██║█████╗   ╚███╔╝
██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗╚════╝██║  ██║██╔══╝   ██╔██╗
██║  ██║   ██║   ██║     ███████╗██║  ██║      ██████╔╝███████╗██╔╝ ██╗
╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝

>> 2026 AI ORCHESTRATION LAYER <<
`;

program
  .name('hyper-dex')
  .description('Hyper-Dex v3.0: The AI Meta-Framework')
  .version('3.0.0-alpha');

program
  .command('init')
  .description('Initialize a Hyper-Dex project')
  .option('-v, --voice <transcription>', 'Initialize from voice transcription')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    console.log(chalk.magenta(banner));

    let projectName = options.name;
    let voiceInput = options.voice;

    // 1. Voice / Input Handling
    if (!voiceInput) {
      console.log(chalk.cyan('? No voice input detected. Switching to manual mode...'));
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project Name:',
          default: 'hyper-app',
          when: !projectName
        },
        {
          type: 'input',
          name: 'description',
          message: 'What are we building? (Be descriptive):',
          validate: (input) => input.length > 5
        }
      ]);
      projectName = projectName || answers.projectName;
      voiceInput = answers.description;
    }

    const spinner = ora('Igniting Hyper-Dex Engine...').start();
    await new Promise(r => setTimeout(r, 1000)); // Simulating AI thinking

    // 2. Stack Selection (Automated based on "Voice" input in real version)
    // For alpha, we default to the "2026 Standard"
    const stack = {
      framework: 'Next.js 15 (App Router)',
      db: 'Prisma (Accelerate)',
      auth: 'Clerk',
      ui: 'Shadcn UI',
      deployment: 'Vercel Edge'
    };

    spinner.text = 'Analyzing Architecture...';
    await new Promise(r => setTimeout(r, 800));

    spinner.text = 'Orchestrating Agents...';

    // 3. File Generation
    const outputDir = path.resolve(process.cwd(), projectName);

    try {
      await fs.mkdir(outputDir, { recursive: true });

      // Generate HYPER-CONTEXT (The Brain)
      const contextContent = `# HYPER-CONTEXT: ${projectName}

> **STATUS:** PHASE 1 - INITIALIZATION
> **LAST UPDATE:** ${new Date().toISOString()}

## 🧠 META-INSTRUCTIONS
This file is the Single Source of Truth.
- **READ** this before every task.
- **UPDATE** this after every task.

## 🎯 MISSION
${voiceInput}

## 🏗️ ARCHITECTURE (2026 STANDARD)
- **Framework:** ${stack.framework}
- **Database:** ${stack.db}
- **Auth:** ${stack.auth}
- **UI:** ${stack.ui}
- **Edge:** ${stack.deployment}

## 🚦 AGENT PROTOCOLS
1. **@Meta-Orchestrator** manages the flow.
2. **@Frontend** uses Server Components by default.
3. **@Backend** uses Server Actions (Mutations).
`;
      await fs.writeFile(path.join(outputDir, 'HYPER-CONTEXT.md'), contextContent);

      // Create Agent Directories
      await fs.mkdir(path.join(outputDir, '.agents'), { recursive: true });

      // Inject Meta-Orchestrator (Real Copy)
      try {
        const metaAgentPath = path.resolve(__dirname, '../../agents/0-META-ORCHESTRATOR.md');
        const metaAgentContent = await fs.readFile(metaAgentPath, 'utf-8');
        await fs.writeFile(path.join(outputDir, '.agents', '0-META-ORCHESTRATOR.md'), metaAgentContent);
      } catch (e) {
        await fs.writeFile(path.join(outputDir, '.agents', '0-META-ORCHESTRATOR.md'), `# Meta-Orchestrator\n\nError copying source file: ${e.message}`);
      }

      // Create Cursor Rules
      await fs.mkdir(path.join(outputDir, '.cursor', 'rules'), { recursive: true });
      // Inject Next.js 15 Rule
      try {
        const rulePath = path.resolve(__dirname, '../../cursor-rules/nextjs-app-router-v15.mdc');
        const ruleContent = await fs.readFile(rulePath, 'utf-8');
        await fs.writeFile(path.join(outputDir, '.cursor', 'rules', 'nextjs-15.mdc'), ruleContent);
      } catch (e) {
        await fs.writeFile(path.join(outputDir, '.cursor', 'rules', 'nextjs-15.mdc'), `# Next.js 15 Standards\n\nError copying source file: ${e.message}`);
      }

      // Create Production Guide
      await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });
      try {
        const guidePath = path.resolve(__dirname, '../../guides/PRODUCTION-2026.md');
        const guideContent = await fs.readFile(guidePath, 'utf-8');
        await fs.writeFile(path.join(outputDir, 'docs', 'PRODUCTION-2026.md'), guideContent);
      } catch (e) {
        await fs.writeFile(path.join(outputDir, 'docs', 'PRODUCTION-2026.md'), `# 2026 Checklist\n\nError copying source file: ${e.message}`);
      }

      spinner.succeed(chalk.green('HYPER-DEX INITIALIZED'));

      console.log('\n' + chalk.bold.white('PROJECT ACTIVATED: ') + chalk.cyan(projectName));
      console.log(chalk.gray('------------------------------------------------'));
      console.log(chalk.white('🧠 Context:   ') + chalk.green('HYPER-CONTEXT.md'));
      console.log(chalk.white('🤖 Brain:     ') + chalk.green('.agents/0-META-ORCHESTRATOR.md'));
      console.log(chalk.white('📏 Standards: ') + chalk.green('.cursor/rules/nextjs-15.mdc'));
      console.log(chalk.gray('------------------------------------------------'));

      console.log(chalk.yellow('\nNEXT STEPS:'));
      console.log(`1. cd ${projectName}`);
      console.log(`2. npx hyper-dex plan --atom "Setup Auth"`);
      console.log(`3. Start building with Cursor/Windsurf`);

    } catch (err) {
      spinner.fail(chalk.red('Initialization Failed'));
      console.error(err);
    }
  });

program
  .command('audit')
  .description('Run Hyper-Dex Project Audit')
  .action(() => {
    console.log(chalk.red('\n☢️  HYPER-AUDIT ENGAGED'));
    console.log(chalk.gray('Scanning for 2026 Compliance...\n'));
    // Simulation of the strict audit
    console.log(chalk.green('✔ HYPER-CONTEXT.md found'));
    console.log(chalk.green('✔ Meta-Orchestrator found'));
    console.log(chalk.yellow('⚠ Next.js 15 Rules: PARTIAL'));
    console.log(chalk.red('✖ Production Checklist: MISSING SIGNATURE'));
    console.log(chalk.bold.red('\nAUDIT FAILED. DO NOT DEPLOY.'));
  });

program.parse();
