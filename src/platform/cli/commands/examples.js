// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Examples module
 * @module commands/examples
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNIPPETS_DIR = path.resolve(__dirname, '../../assets/snippets');

const EXAMPLES = {
  taskflow: {
    id: 'taskflow',
    name: 'TaskFlow',
    stack: 'Next.js + Prisma + Clerk',
    description: 'Project/task workflow app with collaborative boards.',
  },
  invoiceflow: {
    id: 'invoiceflow',
    name: 'InvoiceFlow',
    stack: 'Next.js + Stripe + PostgreSQL',
    description: 'Invoicing and billing automation starter.',
  },
  habitstack: {
    id: 'habitstack',
    name: 'HabitStack',
    stack: 'React + Node.js + SQLite',
    description: 'Habit tracking starter with analytics.',
  },
};

export function registerExamplesCommand(program) {
  const cmd = program
    .command('examples')
    .description('Project examples and snippet library (use `view` or `init`)');

  cmd
    .command('list')
    .description('List available project examples')
    .action(async () => {
      printInfo(chalk.bold('\nAvailable Examples:\n'));
      Object.values(EXAMPLES).forEach((example) => {
        printInfo(chalk.cyan(`- ${example.name}`) + chalk.gray(` (${example.id})`));
      });
      printInfo('');
    });

  cmd
    .command('view <id>')
    .description('View example details')
    .action(async (id) => {
      const example = EXAMPLES[id.toLowerCase()];
      if (!example) {
        printError(chalk.red(`Example "${id}" not found.`));
        return;
      }

      printInfo(chalk.bold(`\n${example.name}\n`));
      printInfo(`ID: ${example.id}`);
      printInfo(`Stack: ${example.stack}`);
      printInfo(`Description: ${example.description}\n`);
    });

  cmd
    .command('init <id>')
    .description('Initialize a project from an example')
    .option('--name <name>', 'Project folder name')
    .action(async (id, options) => {
      const example = EXAMPLES[id.toLowerCase()];
      if (!example) {
        printError(chalk.red(`Example "${id}" not found.`));
        return;
      }

      const projectName = options.name || `${example.id}-project`;
      const projectDir = path.resolve(process.cwd(), projectName);
      await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });

      const pkg = {
        name: projectName,
        private: true,
        version: '0.1.0',
        scripts: { dev: 'echo \"Start development\"' },
      };

      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2));
      await fs.writeFile(
        path.join(projectDir, 'CONTEXT.md'),
        `# ${example.name}\n\nStack: ${example.stack}\n\n${example.description}\n`
      );
      await fs.writeFile(
        path.join(projectDir, 'src', 'index.js'),
        `console.log('Welcome to ${example.name}');\n`
      );

      printSuccess(chalk.green(`Initialized ${example.name} in ${projectName}`));
      printInfo(chalk.bold('\nNext steps:\n'));
      printInfo(chalk.gray(`  cd ${projectName}`));
      printInfo(chalk.gray('  npm install'));
      printInfo(chalk.gray('  npm run dev\n'));
    });

  cmd
    .command('snippets')
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

  cmd.action(() => {
    printWarning(chalk.yellow('Use `examples list`, `examples view <id>`, or `examples init <id>`.'));
  });
}
