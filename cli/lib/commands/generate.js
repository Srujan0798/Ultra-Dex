/**
 * ultra-dex generate command
 * Generates a full 34-section implementation plan from an idea using AI
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { SYSTEM_PROMPT, generateUserPrompt } from '../templates/prompts/generate-plan.js';
import { validateSafePath } from '../utils/validation.js';
import { githubTreeUrl, githubWebUrl } from '../config/urls.js';
import { saveState } from './plan.js';
import { getRandomMessage } from '../utils/messages.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { getCache } from '../cache/index.js';

export function registerGenerateCommand(program) {
  program
    .command('generate [idea]')
    .description('Create the plan (Thanos style) - AI Generates Full Plan')
    .option('-p, --provider <provider>', 'AI provider (claude, openai, gemini)')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-o, --output <directory>', 'Output directory', '.')
    .option('-k, --key <apiKey>', 'API key (or use environment variable)')
    .option('--stream', 'Stream output in real-time', true)
    .option('--no-stream', 'Disable streaming')
    .option('--cache', 'Use response caching to reduce API costs')
    .action(async (idea, options) => {
      try {
        printInfo(chalk.cyan('\n🚀 Ultra-Dex Plan Generator (Reality Stone Mode)\n'));
        printInfo(chalk.hex('#7c3aed').italic(`"${getRandomMessage('start')}"`));
        process.stdout.write('\n');

        const dirValidation = validateSafePath(options.output, 'Output directory');
        if (dirValidation !== true) {
          printError(chalk.red(dirValidation));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }

        // Check configured providers
        const configured = checkConfiguredProviders();
        const hasProvider = configured.some(p => p.configured) || options.key;

        if (!hasProvider) {
          printWarning(chalk.yellow('⚠️  No Infinity Stones (AI Keys) configured.\n'));
          printInfo(chalk.white('Set one of these environment variables:'));
          configured.forEach(p => {
            process.stdout.write(chalk.gray(`  export ${p.envKey}=your-key-here\n`));
          });
          printInfo(chalk.white('\nOr use --key option:'));
          process.stdout.write(chalk.gray('  npx ultra-dex generate "your idea" --key sk-...\n'));
          return;
        }

        // Get idea if not provided
        if (!idea) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'idea',
              message: 'Describe the reality you wish to create:',
              validate: input => input.trim().length > 10 || 'Please provide a more detailed description',
            },
          ]);
          idea = answers.idea;
        }

        // Select provider
        const providerId = options.provider || getDefaultProvider();
        if (!providerId) {
          printError(chalk.red('No provider available. Set an API key.'));
          return;
        }

        printInfo(chalk.gray(`Using provider: ${providerId}`));
        printInfo(chalk.gray(`Idea: "${idea}"\n`));

        // Create provider instance
        let provider;
        try {
          provider = createProvider(providerId, {
            apiKey: options.key,
            model: options.model,
            maxTokens: 16000, // Large output for full plan
          });
        } catch (err) {
          printError(chalk.red(`Error: ${err.message}`));
          return;
        }

        // Generate the plan
        const spinner = ora('Reshaping reality (Generating Plan)...').start();
        const startTime = Date.now();

        try {
          let result;
          let planContent = '';

          // Check cache if enabled
          let cachedResult = null;
          if (options.cache) {
            const cache = getCache();
            const model = options.model || (provider.getDefaultModel ? provider.getDefaultModel() : 'default');
            cachedResult = await cache.get(providerId, model, SYSTEM_PROMPT, generateUserPrompt(idea));
          }

          if (options.cache && cachedResult) {
            spinner.succeed('Plan retrieved from cache!');
            printInfo(chalk.green(`  💾 Cache hit! Saved API call and costs.`));
            result = cachedResult.response;
            planContent = result.content;

            // Show cache metrics
            const stats = cache.getStats();
            printInfo(chalk.gray(`  📊 Cache Hit Rate: ${(stats.hitRate * 100).toFixed(1)}% | Estimated Savings: $${stats.estimatedSavings.toFixed(2)}`));
          } else {
            if (options.stream) {
              spinner.stop();
              printInfo(chalk.cyan('📝 Manifesting Reality:\n'));
              process.stdout.write(chalk.gray('─'.repeat(60)) + '\n');

              result = await provider.generateStream(
                SYSTEM_PROMPT,
                generateUserPrompt(idea),
                (chunk) => {
                  process.stdout.write(chunk);
                  planContent += chunk;
                }
              );

              process.stdout.write(chalk.gray('\n' + '─'.repeat(60)) + '\n');
            } else {
              result = await provider.generate(SYSTEM_PROMPT, generateUserPrompt(idea));
              planContent = result.content;
              spinner.succeed('Plan generated!');
            }

            // Cache the result if caching is enabled
            if (options.cache) {
              const cache = getCache();
              await cache.set(providerId, options.model || provider.getDefaultModel(), SYSTEM_PROMPT, generateUserPrompt(idea), result);

              // Show cache metrics
              const stats = cache.getStats();
              printInfo(chalk.gray(`  💾 Cached for future use. Estimated Savings: $${stats.estimatedSavings.toFixed(2)}`));
            }
          }

          // Calculate stats
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const cost = provider.estimateCost(result.usage.inputTokens, result.usage.outputTokens);

          // Save the plan
          const outputDir = path.resolve(options.output);
          await fs.mkdir(outputDir, { recursive: true });

          const planPath = path.join(outputDir, 'IMPLEMENTATION-PLAN.md');
          const contextPath = path.join(outputDir, 'CONTEXT.md');
          const quickStartPath = path.join(outputDir, 'QUICK-START.md');

          // Add header to plan
          const header = `# Implementation Plan

> Generated by Ultra-Dex AI Plan Generator (Doomsday Edition)

`;
          if (!planContent.startsWith('#')) {
            planContent = header + planContent;
          }

          await fs.writeFile(planPath, planContent);

          // --- NEW: Generate state.json (ACTIVE SCALFOLDING) ---
          const projectName = idea.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');

          const state = {
            project: {
              name: projectName,
              version: '0.1.0',
              mode: 'AI-First',
              idea: idea
            },
            phases: [
              {
                id: '1',
                name: 'Phase 1: Foundation',
                status: 'in_progress',
                steps: [
                  { id: '1.1', task: 'Setup project boilerplate', status: 'pending' },
                  { id: '1.2', task: 'Database schema design', status: 'pending' },
                  { id: '1.3', task: 'Authentication implementation', status: 'pending' }
                ]
              },
              {
                id: '2',
                name: 'Phase 2: Core Features',
                status: 'pending',
                steps: [
                  { id: '2.1', task: 'Implement primary feature loop', status: 'pending' },
                  { id: '2.2', task: 'API endpoint development', status: 'pending' }
                ]
              }
            ],
            agents: {
              active: ['planner', 'cto'],
              registry: ['planner', 'cto', 'backend', 'frontend', 'database', 'testing', 'reviewer']
            }
          };

          await saveState(state);

          // Generate CONTEXT.md
          const contextContent = `# Project Context

## Project Info
**Created:** ${new Date().toLocaleDateString()}
**Idea:** ${idea}
**Status:** Planning

## Summary
${idea}

## Current Focus
Review implementation plan and begin development.

## Ultra-Dex Resources
- Official Template: ${githubWebUrl()}
- Documentation: ${githubTreeUrl('docs')}
`;

          await fs.writeFile(contextPath, contextContent);

          // Generate QUICK-START.md
          const quickStartContent = `# Quick Start

## Project Idea
${idea}

## Next Steps
1. Review IMPLEMENTATION-PLAN.md
2. Start with the first feature
3. Use Ultra-Dex agents for guidance

## AI Agents (The Avengers)
- @Planner (Nick Fury): Break down tasks
- @CTO (Iron Man): Architecture decisions
- @Backend (Thor): API logic
- @Frontend (Spider-Man): UI components
- @Testing (Ant-Man): QA and tests
`;

          await fs.writeFile(quickStartPath, quickStartContent);

          spinner.succeed(chalk.green('Reality successfully rewritten!'));

          printSuccess(chalk.green('\n✅ Files created:'));
          printInfo(chalk.gray(`  ${planPath}`));
          printInfo(chalk.gray(`  ${contextPath}`));
          printInfo(chalk.gray(`  ${quickStartPath}`));
          printInfo(chalk.gray(`  .ultra/state.json (GOD MODE ACTIVE)`));
          printInfo(chalk.gray(`\n⏱️  Time: ${elapsed}s`));
          printInfo(chalk.gray(`💰 Est. cost: ${cost}`));

          printInfo(chalk.bold('\nNext steps:'));
          printInfo(chalk.cyan('  1. Review IMPLEMENTATION-PLAN.md'));
          printInfo(chalk.cyan('  2. Run `ultra-dex dashboard` to visualize your progress'));
          printInfo(chalk.cyan('  3. Run `ultra-dex build` to let Auto-Pilot take the first task'));
          printInfo(chalk.cyan('  4. Summon Avengers (AI agents) for guidance\n'));
        } catch (err) {
          spinner.fail(chalk.red('Failed to manifest reality'));
          printError(chalk.red('Error:'), err.message);
          process.exitCode = 1;
          process.exit(process.exitCode);
        }
      } catch (error) {
        await handleError(error, { command: 'generate', idea, options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}
