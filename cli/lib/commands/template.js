import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '../../../templates');

async function listTemplates() {
  const entries = await fs.readdir(TEMPLATE_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function copyTemplate(name, targetDir) {
  const source = path.join(TEMPLATE_ROOT, name);
  await fs.mkdir(targetDir, { recursive: true });
  const { copyDirectory } = await import('../utils/files.js');
  await copyDirectory(source, targetDir);
}

export function registerTemplateCommand(program) {
  const cmd = program.command('template').description('Unified template generator');

  cmd
    .argument('[name]')
    .option('--interactive', 'Interactive template chooser')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (name, options, command) => {
      if (options.interactive) {
        const templates = await listTemplates();
        if (!templates.length) {
          printWarning(chalk.yellow('No templates available.'));
          return;
        }
        const answers = await inquirer.prompt([
          { type: 'list', name: 'template', message: 'Choose a template', choices: templates },
          { type: 'input', name: 'dir', message: 'Target directory', default: options.dir }
        ]);
        await copyTemplate(answers.template, path.resolve(answers.dir));
        printSuccess(chalk.green(`✅ Template ${answers.template} generated.`));
        return;
      }

      if (name) {
        try {
          await copyTemplate(name, path.resolve(options.dir));
          printSuccess(chalk.green(`✅ Template ${name} generated.`));
        } catch (error) {
          printError(chalk.red(`Template generation failed: ${error.message}`));
        }
        return;
      }

      command.help();
    });

  cmd
    .command('list')
    .description('List available templates')
    .action(async () => {
      const templates = await listTemplates();
      templates.forEach((t) => printInfo(`- ${t}`));
    });

  cmd
    .command('use <name>')
    .description('Generate a template in the current directory')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (name, options) => {
      try {
        await copyTemplate(name, path.resolve(options.dir));
        printSuccess(chalk.green(`✅ Template ${name} generated.`));
      } catch (error) {
        printError(chalk.red(`Template generation failed: ${error.message}`));
      }
    });

  cmd
    .command('saaskit')
    .description('Generate SaaSKit template')
    .action(async () => {
      await copyTemplate('saaskit', process.cwd());
      printSuccess(chalk.green('✅ SaaSKit template generated.'));
    });

  cmd
    .command('habitstack')
    .description('Generate HabitStack template')
    .action(async () => {
      await copyTemplate('habitstack', process.cwd());
      printSuccess(chalk.green('✅ HabitStack template generated.'));
    });

  cmd
    .command('devtoolshub')
    .description('Generate DevToolsHub template')
    .action(async () => {
      await copyTemplate('devtoolshub', process.cwd());
      printSuccess(chalk.green('✅ DevToolsHub template generated.'));
    });

  cmd
    .command('supportdesk')
    .description('Generate SupportDesk template')
    .action(async () => {
      await copyTemplate('supportdesk', process.cwd());
      printSuccess(chalk.green('✅ SupportDesk template generated.'));
    });

  cmd
    .command('courseforge')
    .description('Generate CourseForge template')
    .action(async () => {
      await copyTemplate('courseforge', process.cwd());
      printSuccess(chalk.green('✅ CourseForge template generated.'));
    });

  cmd
    .command('contentstudio')
    .description('Generate ContentStudio template')
    .action(async () => {
      await copyTemplate('contentstudio', process.cwd());
      printSuccess(chalk.green('✅ ContentStudio template generated.'));
    });
}
