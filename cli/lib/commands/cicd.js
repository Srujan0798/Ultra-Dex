// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '../../../templates/cicd');

function detectPlatform() {
  if (exists('.gitlab-ci.yml')) return 'gitlab';
  if (exists('Jenkinsfile')) return 'jenkins';
  if (exists('azure-pipelines.yml')) return 'azure';
  if (exists('.circleci/config.yml')) return 'circleci';
  return 'github';
}

function exists(filePath) {
  return fsSync.existsSync(path.resolve(process.cwd(), filePath));
}

async function copyTemplate(source, target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const content = await fs.readFile(source, 'utf8');
  await fs.writeFile(target, content, 'utf8');
}

export function registerCicdCommand(program) {
  const cmd = program.command('cicd').description('CI/CD template generator');

  cmd
    .command('init')
    .description('Initialize CI/CD pipeline')
    .option('--platform <platform>', 'github|gitlab|circleci|azure|jenkins')
    .option('--advanced', 'Use advanced template (GitHub only)')
    .option('--basic', 'Use basic template')
    .option('--pr-review', 'Include PR auto-review workflow')
    .option('--nightly', 'Include nightly schedule (GitHub)')
    .action(async (options) => {
      try {
        const platform = options.platform || detectPlatform();
        printInfo(chalk.cyan(`\nSetting up CI/CD for ${platform}...`));

        if (platform === 'github') {
          const templateName = options.advanced ? 'github-advanced.yml' : 'github-advanced.yml';
          const source = path.join(TEMPLATE_ROOT, templateName);
          const target = path.resolve(process.cwd(), '.github', 'workflows', 'ultra-dex.yml');
          await copyTemplate(source, target);
          printSuccess(chalk.green(`✅ GitHub Actions template written to ${target}`));

          if (options.prReview) {
            const prSource = path.join(TEMPLATE_ROOT, 'pr-review.yml');
            const prTarget = path.resolve(
              process.cwd(),
              '.github',
              'workflows',
              'ultra-dex-pr-review.yml'
            );
            await copyTemplate(prSource, prTarget);
            printSuccess(chalk.green('✅ PR review workflow added.'));
          }

          if (options.nightly) {
            const nightlyTarget = path.resolve(
              process.cwd(),
              '.github',
              'workflows',
              'ultra-dex-nightly.yml'
            );
            await fs.writeFile(
              nightlyTarget,
              `name: Ultra-Dex Nightly\n\non:\n  schedule:\n    - cron: '0 3 * * *'\n\njobs:\n  nightly:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm test\n`
            );
            printSuccess(chalk.green('✅ Nightly schedule added.'));
          }

          return;
        }

        if (platform === 'gitlab') {
          const source = path.join(TEMPLATE_ROOT, 'gitlab-ci.yml');
          const target = path.resolve(process.cwd(), '.gitlab-ci.yml');
          await copyTemplate(source, target);
          printSuccess(chalk.green(`✅ GitLab CI template written to ${target}`));
          return;
        }

        if (platform === 'circleci') {
          const source = path.join(TEMPLATE_ROOT, 'circleci-config.yml');
          const target = path.resolve(process.cwd(), '.circleci', 'config.yml');
          await copyTemplate(source, target);
          printSuccess(chalk.green(`✅ CircleCI template written to ${target}`));
          return;
        }

        if (platform === 'azure') {
          const source = path.join(TEMPLATE_ROOT, 'azure-pipelines.yml');
          const target = path.resolve(process.cwd(), 'azure-pipelines.yml');
          await copyTemplate(source, target);
          printSuccess(chalk.green(`✅ Azure Pipelines template written to ${target}`));
          return;
        }

        if (platform === 'jenkins') {
          const source = path.join(TEMPLATE_ROOT, 'Jenkinsfile');
          const target = path.resolve(process.cwd(), 'Jenkinsfile');
          await copyTemplate(source, target);
          printSuccess(chalk.green(`✅ Jenkinsfile written to ${target}`));
          return;
        }

        printWarning(chalk.yellow('Unknown platform.'));
      } catch (error) {
        printError(chalk.red(`CI/CD init failed: ${error.message}`));
      }
    });
}
