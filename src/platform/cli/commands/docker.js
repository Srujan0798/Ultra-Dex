// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Docker module
 * @module commands/docker
 */

import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const TEMPLATE_ROOT = path.resolve(process.cwd(), 'templates', 'docker');

async function copyTemplate(fileName, targetDir) {
  const source = path.join(TEMPLATE_ROOT, fileName);
  const dest = path.join(targetDir, fileName);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(source, dest);
}

export function registerDockerCommand(program) {
  const cmd = program.command('docker').description('Docker configuration generator');

  cmd
    .command('init')
    .description('Generate Dockerfile for Ultra-Dex')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyTemplate('Dockerfile', targetDir);
        printSuccess(chalk.green('✅ Dockerfile generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate Dockerfile: ${error.message}`));
      }
    });

  cmd
    .command('compose')
    .description('Generate docker-compose stack')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyTemplate('docker-compose.yml', targetDir);
        const nginxSource = path.join(TEMPLATE_ROOT, 'nginx.conf');
        const nginxTarget = path.join(targetDir, 'nginx.conf');
        await fs.copyFile(nginxSource, nginxTarget);
        printSuccess(chalk.green('✅ docker-compose.yml generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate compose stack: ${error.message}`));
      }
    });

  cmd
    .command('all')
    .description('Generate full Docker config (Dockerfile + compose)')
    .option('--dir <dir>', 'Target directory', '.')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyTemplate('Dockerfile', targetDir);
        await copyTemplate('docker-compose.yml', targetDir);
        await fs.copyFile(
          path.join(TEMPLATE_ROOT, 'nginx.conf'),
          path.join(targetDir, 'nginx.conf')
        );
        printSuccess(chalk.green('✅ Docker config generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate Docker config: ${error.message}`));
      }
    });

  cmd
    .command('templates')
    .description('Show template location')
    .action(() => {
      printInfo(`Docker templates: ${TEMPLATE_ROOT}`);
    });
}
