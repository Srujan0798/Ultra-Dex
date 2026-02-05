import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const TEMPLATE_ROOT = path.resolve(process.cwd(), 'templates', 'env');
const REQUIRED_KEYS = [
  'NODE_ENV',
  'PORT',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_AI_KEY',
  'DATABASE_URL'
];

async function copyEnvFile(name, targetDir) {
  const source = path.join(TEMPLATE_ROOT, name);
  const dest = path.join(targetDir, name);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(source, dest);
}

function parseEnv(content) {
  return content.split(/\r?\n/).reduce((acc, line) => {
    if (!line || line.trim().startsWith('#')) return acc;
    const [key, ...rest] = line.split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});
}

export function registerEnvCommand(program) {
  const cmd = program.command('env').description('Environment config manager');

  cmd
    .command('init')
    .description('Generate environment templates')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyEnvFile('.env.production', targetDir);
        await copyEnvFile('.env.staging', targetDir);
        printSuccess(chalk.green('✅ Environment templates generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate env templates: ${error.message}`));
      }
    });

  cmd
    .command('switch <name>')
    .description('Switch active environment')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (name, options) => {
      try {
        const targetDir = path.resolve(options.dir);
        const source = path.join(targetDir, `.env.${name}`);
        const dest = path.join(targetDir, '.env');
        await fs.copyFile(source, dest);
        printSuccess(chalk.green(`✅ Switched to ${name} environment.`));
      } catch (error) {
        printError(chalk.red(`Failed to switch environment: ${error.message}`));
      }
    });

  cmd
    .command('validate')
    .description('Validate environment variables')
    .option('--file <path>', 'Env file to validate', '.env')
    .action(async (options) => {
      try {
        const filePath = path.resolve(options.file);
        const content = await fs.readFile(filePath, 'utf8');
        const parsed = parseEnv(content);
        const missing = REQUIRED_KEYS.filter((key) => !(key in parsed) || parsed[key] === '');
        if (missing.length) {
          printWarning(chalk.yellow(`Missing keys: ${missing.join(', ')}`));
          process.exitCode = 1;
          return;
        }
        printSuccess(chalk.green('✅ Environment looks valid.'));
      } catch (error) {
        printError(chalk.red(`Failed to validate env: ${error.message}`));
      }
    });

  cmd
    .command('templates')
    .description('Show template location')
    .action(() => {
      printInfo(`Env templates: ${TEMPLATE_ROOT}`);
    });
}
