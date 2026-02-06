// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex fix command
 * Self-Healing: Scans code and applies AI fixes automatically
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { runQualityScan } from '../quality/scanner.js';
import {
  createProvider,
  getDefaultProvider,
  checkConfiguredProviders,
} from '../providers/index.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerFixCommand(program) {
  const fixCmd = program
    .command('fix')
    .description('Self-Healing: Scan and fix code quality issues')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('--dry-run', 'Show fixes without applying')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🚑 Ultra-Dex Self-Healing\n'));

        // Check for API key
        const configured = checkConfiguredProviders();
        const hasProvider = configured.some((p) => p.configured) || options.key;

        if (!hasProvider) {
          printWarning(chalk.yellow('⚠️  No AI provider configured.'));
          printInfo(chalk.white('Self-healing requires an AI provider.'));
          return;
        }

        printInfo(chalk.gray('Scanning project...'));
        const results = await runQualityScan(process.cwd());

        if (results.failed === 0 && results.warnings === 0) {
          printSuccess(chalk.green('✅ No issues found. System healthy.'));
          return;
        }

        printInfo(chalk.yellow(`Found ${results.failed} errors and ${results.warnings} warnings.`));

        const providerId = options.provider || getDefaultProvider();
        let provider;
        try {
          provider = createProvider(providerId, { apiKey: options.key, maxTokens: 4000 });
        } catch (error) {
          printError(chalk.red(`Failed to initialize provider: ${error.message}`));
          return;
        }

        // Group by file
        const issuesByFile = {};
        results.details.forEach((issue) => {
          if (!issuesByFile[issue.file]) issuesByFile[issue.file] = [];
          issuesByFile[issue.file].push(issue);
        });

        for (const [file, issues] of Object.entries(issuesByFile)) {
          printInfo(chalk.bold(`\nFixing ${file}...`));

          try {
            const filePath = path.resolve(process.cwd(), file);
            const content = await fs.readFile(filePath, 'utf8');

            const prompt = `You are an expert code fixer. Fix the following issues in the code file.
            
ISSUES TO FIX:
${issues.map((i) => `- [${i.severity}] ${i.message}`).join('\n')}

FILE CONTENT:
\`\`\`
${content}
\`\`\`

Return ONLY the full corrected file content. Do not include markdown code blocks or explanations. Just the code.`;

            if (options.dryRun) {
              printInfo(chalk.gray('Dry run: Skipping AI generation.'));
              continue;
            }

            const result = await provider.generate(
              'You are a code fixing bot. Output only code.',
              prompt
            );
            let fixedCode = result.content.trim();

            // clean up markdown code blocks if AI added them
            if (fixedCode.startsWith('```')) {
              fixedCode = fixedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
            }

            await fs.writeFile(filePath, fixedCode);
            printSuccess(chalk.green(`✓ Fixed ${issues.length} issues in ${file}`));
          } catch (err) {
            printError(chalk.red(`✗ Failed to fix ${file}: ${err.message}`));
          }
        }

        printSuccess(chalk.green('\n✨ Self-healing complete.'));
      } catch (error) {
        await handleError(error, { command: 'fix', options });
        process.exit(error.exitCode || 1);
      }
    });

  fixCmd._examples = [
    { command: 'ultra-dex fix --dry-run', description: 'Preview suggested fixes without applying' },
    { command: 'ultra-dex fix --provider claude', description: 'Run with a specific AI provider' },
    { command: 'ultra-dex fix', description: 'Scan and apply fixes with default provider' },
  ];
}

export default { registerFixCommand };
