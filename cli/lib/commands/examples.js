// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNIPPETS_DIR = path.resolve(__dirname, '../../assets/snippets');

export function registerExamplesCommand(program) {
  const cmd = program.command('examples').description('Code Snippet Library');

  cmd
    .command('list')
    .description('List available code snippets')
    .action(async () => {
      try {
        const files = await fs.readdir(SNIPPETS_DIR);
        printInfo(chalk.bold('\nAvailable Snippets:\n'));
        files.forEach((file) => {
          const name = path.parse(file).name;
          printInfo(chalk.cyan(`- ${name}`));
        });
        printInfo('');
      } catch (error) {
        printError(chalk.red(`Failed to list snippets: ${error.message}`));
      }
    });

  cmd
    .command('get <name>')
    .description('Get a code snippet')
    .action(async (name) => {
      try {
        const files = await fs.readdir(SNIPPETS_DIR);
        const match = files.find((f) => path.parse(f).name === name);

        if (!match) {
          printError(chalk.red(`Snippet "${name}" not found.`));
          return;
        }

        const content = await fs.readFile(path.join(SNIPPETS_DIR, match), 'utf8');
        printInfo(chalk.bold(`\n📝 Snippet: ${name}\n`));
        console.log(content);
        printSuccess(chalk.green('\n✅ Copied to clipboard (simulated).'));
      } catch (error) {
        printError(chalk.red(`Failed to get snippet: ${error.message}`));
      }
    });
}