// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex review command
 * Reviews code against the implementation plan using AI
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
// import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import {
  createProvider,
  getDefaultProvider,
  checkConfiguredProviders,
} from '../providers/index.js';
import { SYSTEM_PROMPT, generateReviewPrompt } from '../templates/prompts/review-code.js';
import { validateSafePath } from '../utils/validation.js';
import { buildGraph } from '../utils/graph.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

// File patterns to scan (used for future pattern-based review)
// eslint-disable-next-line no-unused-vars
const CODE_PATTERNS = {
  database: ['**/prisma/schema.prisma', '**/schema.sql', '**/migrations/**', '**/models/**'],
  api: ['**/api/**', '**/routes/**', '**/controllers/**', '**/src/app/api/**'],
  auth: ['**/auth/**', '**/middleware/**', '**/*auth*', '**/*session*'],
  frontend: ['**/components/**', '**/pages/**', '**/app/**', '**/src/app/**'],
  testing: ['**/*.test.*', '**/*.spec.*', '**/tests/**', '**/__tests__/**'],
  config: ['package.json', 'tsconfig.json', '.env.example', 'next.config.*'],
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

async function getDirectoryStructure(dir, depth = 3, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let structure = '';

  for (const entry of entries) {
    // Skip common non-essential directories
    if (['node_modules', '.git', '.next', 'dist', 'build', '.ultra-dex'].includes(entry.name)) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      structure += `${prefix}📁 ${entry.name}/\n`;
      if (depth > 1) {
        structure += await getDirectoryStructure(entryPath, depth - 1, prefix + '  ');
      }
    } else {
      structure += `${prefix}📄 ${entry.name}\n`;
    }
  }

  return structure;
}

async function findKeyFiles(dir) {
  const keyFiles = [];
  const patterns = [
    'package.json',
    'prisma/schema.prisma',
    'src/app/api',
    'app/api',
    'middleware.ts',
    'middleware.js',
    'auth.ts',
    'auth.js',
  ];

  for (const pattern of patterns) {
    const filePath = path.join(dir, pattern);
    if (await fileExists(filePath)) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          const content = await fs.readFile(filePath, 'utf-8');
          keyFiles.push({ path: pattern, content: content.slice(0, 3000) });
        }
      } catch {
        // Skip files we can't read
      }
    }
  }

  return keyFiles;
}

export function registerReviewCommand(program) {
  const reviewCmd = program
    .command('review')
    .description('Review code against the implementation plan')
    .option('-d, --dir <directory>', 'Directory to review', '.')
    .option('-p, --provider <provider>', 'AI provider (claude, openai, gemini)')
    .option('-k, --key <apiKey>', 'API key')
    .option('--quick', 'Quick review without AI (checks file structure only)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔍 Ultra-Dex Code Review\n'));

        const dirValidation = validateSafePath(options.dir, 'Review directory');
        if (dirValidation !== true) {
          printError(chalk.red(dirValidation));
          process.exit(1);
        }

        const reviewDir = path.resolve(options.dir);

        // Check for plan
        const planPath = path.join(reviewDir, 'IMPLEMENTATION-PLAN.md');
        const plan = await readFileSafe(planPath);

        if (!plan) {
          printWarning(chalk.yellow('⚠️  No IMPLEMENTATION-PLAN.md found.\n'));
          printInfo(chalk.white('Run one of these first:'));
          printInfo(chalk.gray('  npx ultra-dex init'));
          printInfo(chalk.gray('  npx ultra-dex generate\n'));
          return;
        }

        // Get directory structure & Build Graph
        const spinner = ora('Scanning codebase & Building Graph...').start();
        const structure = await getDirectoryStructure(reviewDir);
        const keyFiles = await findKeyFiles(reviewDir);

        // GOD MODE: Build CPG
        let graphSummary = 'Graph Not Available';
        try {
          const graph = await buildGraph();
          graphSummary = `
Code Property Graph Stats:
- Files: ${graph.nodes.filter((n) => n.type === 'file').length}
- Functions: ${graph.nodes.filter((n) => n.type === 'function').length}
- Dependencies (Edges): ${graph.edges.length}

Top Dependencies:
${graph.edges
  .slice(0, 10)
  .map((e) => `- ${e.source} -> ${e.target}`)
  .join('\n')}
        `;
        } catch (e) {
          // Fallback if graph fails
        }

        spinner.succeed('Codebase scanned & Graph built');

        if (options.quick) {
          // Quick review - just check structure
          printInfo(chalk.white('\n📁 Project Structure:\n'));
          printInfo(chalk.gray(structure));

          // Quick checks
          const checks = [
            { name: 'IMPLEMENTATION-PLAN.md', path: 'IMPLEMENTATION-PLAN.md' },
            { name: 'CONTEXT.md', path: 'CONTEXT.md' },
            { name: 'package.json', path: 'package.json' },
            { name: 'Database schema', path: 'prisma/schema.prisma' },
            { name: 'API routes', path: 'src/app/api' },
            { name: 'Tests', path: 'tests' },
          ];

          printInfo(chalk.white('\n📋 Quick Checks:\n'));
          for (const check of checks) {
            const exists = await fileExists(path.join(reviewDir, check.path));
            const icon = exists ? chalk.green('✅') : chalk.red('❌');
            printInfo(`  ${icon} ${check.name}`);
          }

          printInfo(chalk.cyan('\n💡 For full AI-powered review, run without --quick\n'));
          return;
        }

        // Full AI review
        const configured = checkConfiguredProviders();
        const hasProvider = configured.some((p) => p.configured) || options.key;

        if (!hasProvider) {
          printWarning(chalk.yellow('\n⚠️  No AI provider configured for full review.\n'));
          printInfo(chalk.white('Options:'));
          printInfo(
            chalk.gray(
              '  1. Set API key: export NVIDIA_API_KEY=nvapi-... (or ANTHROPIC_API_KEY/OPENAI_API_KEY/GOOGLE_AI_KEY)'
            )
          );
          printInfo(chalk.gray('  2. Use --quick for structure-only review'));
          printInfo(chalk.gray('  3. Use --key option: npx ultra-dex review --key sk-...\n'));
          return;
        }

        const providerId = options.provider || getDefaultProvider();
        printInfo(chalk.gray(`Using provider: ${providerId}\n`));

        let provider;
        try {
          provider = createProvider(providerId, {
            apiKey: options.key,
            maxTokens: 4000,
          });
        } catch (err) {
          printError(chalk.red(`Error: ${err.message}`));
          return;
        }

        // Build file summary
        const filesSummary = keyFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join('\n\n');

        // Inject Graph Summary into context
        const contextWithGraph = `${structure}\n\n## ARCHITECTURAL GRAPH (TRUTH)\n${graphSummary}`;

        spinner.start('Analyzing code & graph against plan...');

        try {
          const result = await provider.generate(
            SYSTEM_PROMPT,
            generateReviewPrompt(plan.slice(0, 15000), contextWithGraph, filesSummary)
          );

          spinner.succeed('Analysis complete');

          // Parse the result
          let report;
          try {
            // Try to extract JSON from the response
            const jsonMatch = result.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              report = JSON.parse(jsonMatch[0]);
            } else {
              report = { raw: result.content };
            }
          } catch {
            report = { raw: result.content };
          }

          if (options.json) {
            printInfo(JSON.stringify(report, null, 2));
            return;
          }

          // Display formatted report
          printInfo(chalk.white('\n' + '═'.repeat(60)));
          printInfo(chalk.bold.cyan('  ULTRA-DEX CODE REVIEW REPORT'));
          printInfo(chalk.white('═'.repeat(60) + '\n'));

          if (report.alignmentScore !== undefined) {
            const score = report.alignmentScore;
            const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
            printInfo(chalk.white('  Alignment Score: ') + color.bold(`${score}/100`));
            printInfo('');
          }

          if (report.summary) {
            printInfo(chalk.white('  Summary:'));
            printInfo(chalk.gray(`  ${report.summary}\n`));
          }

          if (report.sections) {
            printInfo(chalk.white('  Section Scores:\n'));
            for (const [section, data] of Object.entries(report.sections)) {
              const icon =
                data.status === 'aligned' ? '✅' : data.status === 'deviated' ? '⚠️' : '❌';
              const scoreColor =
                data.score >= 80 ? chalk.green : data.score >= 60 ? chalk.yellow : chalk.red;
              printInfo(
                `    ${icon} ${section.padEnd(12)} ${scoreColor(`${data.score}%`)} - ${data.notes || ''}`
              );
            }
            printInfo('');
          }

          if (report.criticalIssues?.length) {
            printInfo(chalk.red.bold('  ⚠️  Critical Issues:\n'));
            report.criticalIssues.forEach((issue, i) => {
              printInfo(chalk.red(`    ${i + 1}. ${issue}`));
            });
            printInfo('');
          }

          if (report.suggestions?.length) {
            printInfo(chalk.yellow('  💡 Suggestions:\n'));
            report.suggestions.forEach((suggestion, i) => {
              printInfo(chalk.gray(`    ${i + 1}. ${suggestion}`));
            });
            printInfo('');
          }

          if (report.nextSteps?.length) {
            printInfo(chalk.cyan('  📋 Next Steps:\n'));
            report.nextSteps.forEach((step, i) => {
              printInfo(chalk.white(`    ${i + 1}. ${step}`));
            });
            printInfo('');
          }

          // If we couldn't parse, show raw
          if (report.raw) {
            printInfo(chalk.white('  Analysis:\n'));
            printInfo(chalk.gray(report.raw));
          }

          printInfo(chalk.white('═'.repeat(60) + '\n'));

          // Cost info
          const cost = provider.estimateCost(result.usage.inputTokens, result.usage.outputTokens);
          printInfo(
            chalk.gray(
              `  Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`
            )
          );
          printInfo(chalk.gray(`  Cost: ~$${cost.total.toFixed(4)}\n`));
        } catch (err) {
          spinner.fail('Review failed');
          printError(chalk.red(`\nError: ${err.message}`));
        }
      } catch (error) {
        await handleError(error, { command: 'review', options });
        process.exit(error.exitCode || 1);
      }
    });

  reviewCmd._examples = [
    { command: 'ultra-dex review', description: 'Run full AI review using default provider' },
    { command: 'ultra-dex review --quick', description: 'Quick structural review without AI' },
    {
      command: 'ultra-dex review --dir ./apps/web --json',
      description: 'Review a specific directory and emit JSON',
    },
  ];
}

export default { registerReviewCommand };
