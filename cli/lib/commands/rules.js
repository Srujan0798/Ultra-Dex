// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { listRules, installRule } from '../marketplace/rules.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import https from 'https';

const MOCK_RULES_REPO_BASE =
  'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main/cursor-rules';

export function registerRulesCommand(program) {
  const cmd = program.command('rules').description('Cursor rules manager');

  cmd
    .command('list')
    .description('Show all active .mdc rules')
    .option('--community', 'List community rules')
    .option('--enterprise', 'List enterprise rules')
    .action(async (options) => {
      const type = options.enterprise ? 'enterprise' : 'community';
      const rules = await listRules(type);
      if (!rules.length) {
        printWarning(chalk.yellow(`No ${type} rules found.`));
        return;
      }
      printInfo(chalk.cyan(`\n${type.toUpperCase()} Rules\n`));
      rules.forEach((rule) => printInfo(`- ${rule.name} (${rule.file})`));
    });

  cmd
    .command('add <name>')
    .description('Download rule from ultra-dex/rules repo')
    .action(async (name) => {
      try {
        const ruleName = name.endsWith('.mdc') ? name : `${name}.mdc`;
        const url = `${MOCK_RULES_REPO_BASE}/${ruleName}`;

        printInfo(`Downloading ${ruleName} from ${url}...`);

        // Simple download helper
        const downloadFile = (url) => {
          return new Promise((resolve, reject) => {
            https
              .get(url, (response) => {
                if (response.statusCode === 200) {
                  let data = '';
                  response.on('data', (chunk) => (data += chunk));
                  response.on('end', () => resolve(data));
                } else {
                  reject(new Error(`Failed to download: ${response.statusCode}`));
                }
              })
              .on('error', (err) => reject(err));
          });
        };

        const content = await downloadFile(url);

        // Save to temporary file first to use installRule
        const tempPath = path.join(process.cwd(), '.ultra-dex', 'temp', ruleName);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, content);

        const target = await installRule(tempPath, ruleName);

        // Clean up temp
        await fs.unlink(tempPath);

        printSuccess(chalk.green(`✅ Installed rule to ${target}`));
      } catch (error) {
        printError(chalk.red(`Install failed: ${error.message}`));
      }
    });

  cmd
    .command('check')
    .description('Verify no conflicting rules exist')
    .action(async () => {
      const communityRules = await listRules('community');
      const enterpriseRules = await listRules('enterprise');

      const allRules = [...communityRules, ...enterpriseRules];
      const names = allRules.map((r) => r.name);
      const duplicates = names.filter((item, index) => names.indexOf(item) !== index);

      if (duplicates.length > 0) {
        printWarning(chalk.red(`❌ Conflicting rules found: ${duplicates.join(', ')}`));
      } else {
        printSuccess(chalk.green('✅ No conflicting rules found.'));
      }
    });
}

export default { registerRulesCommand };
