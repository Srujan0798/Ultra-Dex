import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

import { QUICK_START_TEMPLATE } from '../templates/quick-start.js';
import { CONTEXT_TEMPLATE } from '../templates/context.js';
import { validateProjectName, validateSafePath } from '../utils/validation.js';
import { ASSETS_ROOT, ROOT_FALLBACK, LIVE_TEMPLATES_ROOT } from '../config/paths.js';
import { copyWithFallback, listWithFallback, readWithFallback } from '../utils/fallback.js';
import { copyDirectory, pathExists } from '../utils/files.js';
import { getRandomMessage } from '../utils/messages.js';

const LIVE_STACKS = {
  'next15-prisma-clerk': 'Next.js 15 + Prisma + Clerk',
  'remix-supabase': 'Remix + Supabase',
  'sveltekit-drizzle': 'SvelteKit + Drizzle',
};

export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize a new Ultra-Dex Project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <directory>', 'Output directory', '.')
    .option('--preview', 'Preview files without creating them')
    .option('--live', 'Generate a runnable scaffold')
    .option('--stack <preset>', 'Preset: next15-prisma-clerk, remix-supabase, sveltekit-drizzle')
    .action(async (options) => {
      console.log(chalk.cyan(program.banner));
      console.log(chalk.hex('#8b5cf6').bold('\n⚡ INITIALIZING PROJECT PROTOCOL...\n'));
      console.log(chalk.italic(chalk.gray(`"${getRandomMessage('start')}"`)));
      console.log('');

      if (options.preview) {
        console.log('\n📋 Project Preview (Files that would be created):\n');
        console.log('  QUICK-START.md');
        console.log('  CONTEXT.md');
        console.log('  IMPLEMENTATION-PLAN.md');
        console.log('  docs/CHECKLIST.md');
        console.log('  docs/AI-PROMPTS.md');
        return;
      }

      const dirValidation = validateSafePath(options.dir, 'Output directory');
      if (dirValidation !== true) {
        console.log(chalk.red(dirValidation));
        process.exit(1);
      }

      if (options.live) {
        const preset = options.stack || 'next15-prisma-clerk';
        if (!LIVE_STACKS[preset]) {
          console.log(chalk.red(`Unknown preset: ${preset}`));
          console.log(chalk.gray(`Available presets: ${Object.keys(LIVE_STACKS).join(', ')}`));
          process.exit(1);
        }

        const outputDir = path.resolve(options.dir);
        if (await pathExists(outputDir, 'dir')) {
          const existing = await fs.readdir(outputDir);
          if (existing.length > 0) {
            console.log(chalk.red('Target directory is not empty. Execution halted to prevent data loss.'));
            process.exit(1);
          }
        }

        const liveSourcePath = path.join(LIVE_TEMPLATES_ROOT, preset);
        const fallbackLivePath = path.join(ROOT_FALLBACK, 'cli', 'assets', 'live-templates', preset);
        let sourcePath = liveSourcePath;
        try {
          await fs.access(liveSourcePath);
        } catch {
          sourcePath = fallbackLivePath;
        }

        const spinner = ora(`Generating ${LIVE_STACKS[preset]} scaffold...`).start();
        try {
          await copyDirectory(sourcePath, outputDir);
          spinner.succeed(chalk.green('Project scaffold generated successfully!'));
          console.log(chalk.gray(`\nPreset: ${preset}`));
          console.log(chalk.gray(`Next steps:`));
          console.log(chalk.cyan(`  1. cd ${outputDir}`));
          console.log(chalk.cyan('  2. npm install'));
          console.log(chalk.cyan('  3. npm run dev\n'));
        } catch (error) {
          spinner.fail(chalk.red('Failed to generate project scaffold'));
          console.error(`[init] ${error?.message ?? error}`);
          process.exit(1);
        }
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'What is the name of this project?',
          default: options.name || 'my-saas',
          validate: validateProjectName,
        },
        {
          type: 'input',
          name: 'ideaWhat',
          message: 'Define the core purpose (What are you building?):',
          validate: (input) => input.length > 0 || 'Please describe your project',
        },
        {
          type: 'input',
          name: 'ideaFor',
          message: 'Target audience (Who are the users)?',
          validate: (input) => input.length > 0 || 'Please specify your target audience',
        },
        {
          type: 'input',
          name: 'problem1',
          message: 'Primary problem to solve:',
          default: '',
        },
        {
          type: 'input',
          name: 'problem2',
          message: 'Secondary problem to solve:',
          default: '',
        },
        {
          type: 'input',
          name: 'problem3',
          message: 'Tertiary problem to solve:',
          default: '',
        },
        {
          type: 'input',
          name: 'feature1',
          message: 'Core feature:',
          default: '',
        },
        {
          type: 'list',
          name: 'frontend',
          message: 'Frontend Technology Stack:',
          choices: ['Next.js', 'Remix', 'SvelteKit', 'Nuxt', 'Other'],
        },
        {
          type: 'list',
          name: 'database',
          message: 'Database Infrastructure:',
          choices: ['PostgreSQL', 'Supabase', 'MongoDB', 'PlanetScale', 'Other'],
        },
        {
          type: 'list',
          name: 'auth',
          message: 'Authentication Provider:',
          choices: ['NextAuth', 'Clerk', 'Auth0', 'Supabase Auth', 'Other'],
        },
        {
          type: 'list',
          name: 'payments',
          message: 'Payment Processor:',
          choices: ['Stripe', 'Lemonsqueezy', 'Paddle', 'None (free)', 'Other'],
        },
        {
          type: 'list',
          name: 'hosting',
          message: 'Deployment Platform:',
          choices: ['Vercel', 'Railway', 'Fly.io', 'AWS', 'Other'],
        },
        {
          type: 'confirm',
          name: 'includeCursorRules',
          message: 'Install IDE intelligence protocols? (Cursor/Copilot Rules)',
          default: true,
        },
        {
          type: 'confirm',
          name: 'includeFullTemplate',
          message: 'Include full 34-section project template?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'includeDocs',
          message: 'Include project documentation standards?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'includeAgents',
          message: 'Configure AI agent orchestration?',
          default: true,
        },
      ]);

      const spinner = ora(getRandomMessage('loading')).start();

      try {
        const outputDir = path.resolve(options.dir, answers.projectName);

        await fs.mkdir(outputDir, { recursive: true });
        await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });

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

        await fs.writeFile(path.join(outputDir, 'QUICK-START.md'), quickStart);
        await fs.writeFile(path.join(outputDir, 'CONTEXT.md'), context);

        const planContent = `# ${answers.projectName} - Implementation Plan

> Generated with Ultra-Dex CLI

## Overview

${answers.ideaWhat} for ${answers.ideaFor}.

---

## Next Steps

1. Open QUICK-START.md and complete the remaining sections
2. Customize the implementation plan based on your requirements
3. Start the agent orchestration to begin development
`;

        await fs.writeFile(path.join(outputDir, 'IMPLEMENTATION-PLAN.md'), planContent);

        if (answers.includeCursorRules) {
          const rulesDir = path.join(outputDir, '.cursor', 'rules');
          await fs.mkdir(rulesDir, { recursive: true });

          const cursorRulesPath = path.join(ASSETS_ROOT, 'cursor-rules');
          const fallbackRulesPath = path.join(ROOT_FALLBACK, 'cursor-rules');
          try {
            const { files: ruleFiles, sourcePath } = await listWithFallback(cursorRulesPath, fallbackRulesPath);
            for (const file of ruleFiles.filter(f => f.endsWith('.mdc'))) {
              await fs.copyFile(
                path.join(sourcePath, file),
                path.join(rulesDir, file)
              );
            }

            const coreRulePath = path.join(sourcePath, '00-ultra-dex-core.mdc');
            try {
              const coreContent = await readWithFallback(coreRulePath, null, 'utf-8');
              const dotGithub = path.join(outputDir, '.github');
              await fs.mkdir(dotGithub, { recursive: true });
              await fs.writeFile(path.join(dotGithub, 'copilot-instructions.md'), coreContent);
            } catch {
              // Core rule not available
            }
          } catch {
            console.log(chalk.red('\n  ✕ IDE intelligence protocols not found.'));
            console.log(chalk.cyan('  Run: ultra-dex fetch --rules'));
          }
        }

        if (answers.includeFullTemplate) {
          const templatePath = path.join(ASSETS_ROOT, 'saas-plan', '04-Imp-Template.md');
          const fallbackTemplatePath = path.join(ROOT_FALLBACK, '@ Ultra DeX', 'Saas plan', '04-Imp-Template.md');
          try {
            await copyWithFallback(templatePath, fallbackTemplatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
          } catch {
            console.log(chalk.red('\n  ✕ Project template not found.'));
            console.log(chalk.cyan('  Run: ultra-dex fetch --docs'));
          }
        }

        if (answers.includeDocs) {
          const verificationPath = path.join(ASSETS_ROOT, 'docs', 'VERIFICATION.md');
          const agentPath = path.join(ASSETS_ROOT, 'agents', 'AGENT-INSTRUCTIONS.md');
          const fallbackVerificationPath = path.join(ROOT_FALLBACK, 'docs', 'VERIFICATION.md');
          const fallbackAgentPath = path.join(ROOT_FALLBACK, 'agents', 'AGENT-INSTRUCTIONS.md');
          try {
            await copyWithFallback(verificationPath, fallbackVerificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
            await copyWithFallback(agentPath, fallbackAgentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
          } catch {
            console.log(chalk.red('\n  ✕ Documentation standards not found.'));
            console.log(chalk.cyan('  Run: ultra-dex fetch --docs'));
          }
        }

        if (answers.includeAgents) {
          const agentsDir = path.join(outputDir, '.agents');
          await fs.mkdir(agentsDir, { recursive: true });

          const agentsSourcePath = path.join(ASSETS_ROOT, 'agents');
          const fallbackAgentsPath = path.join(ROOT_FALLBACK, 'agents');
          try {
            const tiers = ['1-leadership', '2-development', '3-security', '4-devops', '5-quality', '6-specialist'];
            let sourceRoot = agentsSourcePath;
            try {
              await fs.access(agentsSourcePath);
            } catch {
              sourceRoot = fallbackAgentsPath;
            }

            for (const tier of tiers) {
              const tierDir = path.join(agentsDir, tier);
              await fs.mkdir(tierDir, { recursive: true });

              const tierPath = path.join(sourceRoot, tier);
              const tierFiles = await fs.readdir(tierPath);
              for (const file of tierFiles.filter(f => f.endsWith('.md'))) {
                await fs.copyFile(
                  path.join(tierPath, file),
                  path.join(tierDir, file)
                );
              }
            }

            await fs.copyFile(
              path.join(sourceRoot, '00-AGENT_INDEX.md'),
              path.join(agentsDir, '00-AGENT_INDEX.md')
            );
            await fs.copyFile(
              path.join(sourceRoot, 'README.md'),
              path.join(agentsDir, 'README.md')
            );
          } catch {
            console.log(chalk.red('\n  ✕ Agent orchestration assets not found.'));
            console.log(chalk.cyan('  Run: ultra-dex fetch --agents'));
          }
        }

        spinner.succeed(chalk.green('Project initialized successfully!'));

        console.log('\n' + chalk.bold('Artifacts created:'));
        console.log(chalk.gray(`  ${outputDir}/`));
        console.log(chalk.gray('  ├── QUICK-START.md'));
        console.log(chalk.gray('  ├── CONTEXT.md'));
        console.log(chalk.gray('  ├── IMPLEMENTATION-PLAN.md'));
        if (answers.includeFullTemplate) {
          console.log(chalk.gray('  ├── docs/MASTER-PLAN.md'));
        }
        if (answers.includeDocs) {
          console.log(chalk.gray('  ├── docs/CHECKLIST.md'));
          console.log(chalk.gray('  ├── docs/AI-PROMPTS.md'));
        }
        if (answers.includeCursorRules) {
          console.log(chalk.gray('  ├── .cursor/rules/'));
        }
        if (answers.includeAgents) {
          console.log(chalk.gray('  └── .agents/'));
        }

        console.log('\n' + chalk.bold('Next steps:'));
        console.log(chalk.cyan(`  1. cd ${answers.projectName}`));
        console.log(chalk.cyan('  2. Open QUICK-START.md'));
        console.log(chalk.cyan('  3. ultra-dex swarm "Analyze requirements"'));

        console.log('\n' + chalk.hex('#8b5cf6').bold('  ✓ SYSTEM READY.'));
        console.log('');
        
      } catch (error) {
        spinner.fail(chalk.red('Failed to initialize project'));
        console.error(`[init] ${error?.message ?? error}`);
        process.exit(1);
      }
    });
}