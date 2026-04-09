// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Fetch module
 * @module commands/fetch
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs/promises';
import path from 'path';
import { GITHUB_RAW_BASE } from '../config/urls.js';
import { fetchWithRetry } from '../utils/network.js';
import { validateSafePath } from '../utils/validation.js';
import { printError, printInfo, printWarning } from '../utils/output.js';

async function downloadFile(url, destPath) {
  try {
    const response = await fetchWithRetry(url);
    const content = await response.text();
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, content);
    return true;
  } catch (_err) {
    return false;
  }
}

export function registerFetchCommand(program) {
  program
    .command('fetch')
    .argument('[url]', 'Optional URL to fetch (legacy mode)')
    .description('Fetch remote content or download Ultra-Dex assets for offline use')
    .option('-d, --dir <directory>', 'Target directory', '.ultra-dex')
    .option('-o, --output <file>', 'Output file path for URL fetch mode')
    .option('--extract', 'Extract archive after download (legacy compatibility)')
    .option('--no-cache', 'Disable cache for URL fetch mode (legacy compatibility)')
    .option('--assets', 'Fetch all Ultra-Dex assets')
    .option('--agents', 'Fetch only agent prompts')
    .option('--rules', 'Fetch only cursor rules')
    .option('--docs', 'Fetch only documentation')
    .action(async (url, options) => {
      printInfo(chalk.cyan('\n📦 Ultra-Dex Asset Fetcher\n'));

      const dirValidation = validateSafePath(options.dir, 'Target directory');
      if (dirValidation !== true) {
        printError(chalk.red(dirValidation));
        process.exit(1);
      }

      const targetDir = path.resolve(options.dir);

      // Legacy URL mode compatibility.
      if (url) {
        const spinner = ora(`Fetching ${url}...`).start();
        try {
          const response = await fetchWithRetry(url);
          const content = await response.text();
          if (options.output) {
            const outputPath = path.resolve(options.output);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, content);
            spinner.succeed(chalk.green(`Saved to ${outputPath}`));
          } else {
            spinner.succeed(chalk.green(`Fetched ${content.length} bytes`));
            printInfo(content);
          }
          if (options.extract) {
            printInfo(
              chalk.gray('Extract requested (legacy mode): extraction is not implemented.')
            );
          }
          if (options.cache === false) {
            printInfo(chalk.gray('Cache disabled for this fetch.'));
          }
        } catch (error) {
          spinner.fail(chalk.red(`Failed to fetch URL: ${error.message}`));
          process.exitCode = 1;
        }
        return;
      }

      if (!options.assets && !options.agents && !options.rules && !options.docs) {
        printWarning(
          chalk.yellow(
            'URL argument required for remote fetch. Use --assets/--agents/--rules/--docs for asset mode.'
          )
        );
        printInfo(
          chalk.gray('Example: ultra-dex fetch https://example.com/data.json --output data.json')
        );
        return;
      }

      const fetchAll = options.assets || (!options.agents && !options.rules && !options.docs);

      const spinner = ora('Preparing to fetch assets...').start();

      await fs.mkdir(targetDir, { recursive: true });

      let downloaded = 0;
      let failed = 0;

      if (fetchAll || options.rules) {
        spinner.text = 'Fetching cursor rules...';
        const rulesDir = path.join(targetDir, 'cursor-rules');
        await fs.mkdir(rulesDir, { recursive: true });

        const ruleFiles = [
          '00-ultra-dex-core.mdc',
          '01-database.mdc',
          '02-api.mdc',
          '03-auth.mdc',
          '04-frontend.mdc',
          '05-payments.mdc',
          '06-testing.mdc',
          '07-security.mdc',
          '08-deployment.mdc',
          '09-error-handling.mdc',
          '10-performance.mdc',
          '11-nextjs-v15.mdc',
          '12-multi-tenancy.mdc',
        ];

        for (const file of ruleFiles) {
          const url = `${GITHUB_RAW_BASE}/cursor-rules/${file}`;
          const dest = path.join(rulesDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }

        await downloadFile(
          `${GITHUB_RAW_BASE}/cursor-rules/load.sh`,
          path.join(rulesDir, 'load.sh')
        );
        try {
          await fs.chmod(path.join(rulesDir, 'load.sh'), '755');
        } catch {}
      }

      if (fetchAll || options.agents) {
        spinner.text = 'Fetching agent prompts...';
        const agentsDir = path.join(targetDir, 'agents');

        const agentPaths = [
          '00-AGENT_INDEX.md',
          'README.md',
          'AGENT-INSTRUCTIONS.md',
          '1-leadership/cto.md',
          '1-leadership/planner.md',
          '1-leadership/research.md',
          '2-development/backend.md',
          '2-development/frontend.md',
          '2-development/database.md',
          '3-security/security.md',
          '4-devops/devops.md',
          '5-quality/reviewer.md',
          '5-quality/testing.md',
          '5-quality/debugger.md',
          '6-specialist/performance.md',
          '6-specialist/refactoring.md',
          '6-specialist/documentation.md',
        ];

        for (const agentPath of agentPaths) {
          const url = `${GITHUB_RAW_BASE}/agents/${agentPath}`;
          const dest = path.join(agentsDir, agentPath);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }
      }

      if (fetchAll || options.docs) {
        spinner.text = 'Fetching documentation...';
        const docsDir = path.join(targetDir, 'docs');

        const docFiles = [
          'VERIFICATION.md',
          'BUILD-AUTH-30M.md',
          'QUICK-REFERENCE.md',
          'TROUBLESHOOTING.md',
        ];

        for (const file of docFiles) {
          const url = `${GITHUB_RAW_BASE}/docs/${file}`;
          const dest = path.join(docsDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }

        const guidesDir = path.join(targetDir, 'guides');
        const guideFiles = [
          'PROJECT-ORCHESTRATION.md',
          'ADVANCED-WORKFLOWS.md',
          'DATABASE-DECISION-FRAMEWORK.md',
          'ARCHITECTURE-PATTERNS.md',
        ];

        for (const file of guideFiles) {
          const url = `${GITHUB_RAW_BASE}/guides/${file}`;
          const dest = path.join(guidesDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }
      }

      if (failed === 0) {
        spinner.succeed(chalk.green(`Downloaded ${downloaded} files to ${targetDir}`));
      } else {
        spinner.warn(chalk.yellow(`Downloaded ${downloaded} files, ${failed} failed`));
      }

      printInfo(chalk.bold('\n📁 Assets downloaded to:\n'));
      if (fetchAll || options.rules) {
        printInfo(chalk.gray(`  ${targetDir}/cursor-rules/  (12 .mdc files)`));
      }
      if (fetchAll || options.agents) {
        printInfo(chalk.gray(`  ${targetDir}/agents/        (16 agent prompts)`));
      }
      if (fetchAll || options.docs) {
        printInfo(chalk.gray(`  ${targetDir}/docs/          (documentation)`));
        printInfo(chalk.gray(`  ${targetDir}/guides/        (guides)`));
      }

      printInfo(chalk.bold('\n💡 Usage:\n'));
      printInfo(chalk.cyan('  # Copy cursor rules to project'));
      printInfo(chalk.gray(`  cp -r ${targetDir}/cursor-rules .cursor/rules`));
      printInfo(chalk.cyan('\n  # Copy agents to project'));
      printInfo(chalk.gray(`  cp -r ${targetDir}/agents .agents`));
      printInfo(chalk.cyan('\n  # Works offline now!'));
      printInfo(chalk.gray('  No GitHub access needed after fetch.\n'));
    });
}
