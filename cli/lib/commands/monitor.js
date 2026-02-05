import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const TEMPLATE_ROOT = path.resolve(process.cwd(), 'templates', 'monitoring');

async function copyTemplate(name, targetDir) {
  const source = path.join(TEMPLATE_ROOT, name);
  const dest = path.join(targetDir, name);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(source, dest);
}

export function registerMonitorCommand(program) {
  const cmd = program.command('monitor').description('Monitoring stack generator');

  cmd
    .command('init')
    .description('Generate Prometheus and Grafana configs')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyTemplate('prometheus.yml', targetDir);
        await copyTemplate('grafana-dashboard.json', targetDir);
        printSuccess(chalk.green('✅ Monitoring templates generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate monitoring templates: ${error.message}`));
      }
    });

  cmd
    .command('dashboard')
    .description('Show Grafana dashboard template location')
    .action(() => {
      printInfo(`Grafana dashboard: ${path.join(TEMPLATE_ROOT, 'grafana-dashboard.json')}`);
    });

  cmd
    .command('templates')
    .description('Show template location')
    .action(() => {
      printInfo(`Monitoring templates: ${TEMPLATE_ROOT}`);
    });
}
