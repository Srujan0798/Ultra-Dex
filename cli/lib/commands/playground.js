#!/usr/bin/env node

/**
 * Web Playground Command
 * Launch browser-based implementation plan editor
 * Addresses AGENT-CEO-VISION.md: Interactive Web Playground
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerPlaygroundCommand(program) {
  program
    .command('playground')
    .description('Launch web-based implementation plan editor')
    .option('-p, --port <port>', 'Port to run on', '3456')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      try {
        const spinner = ora('Starting Ultra-Dex Playground...').start();

        const port = parseInt(options.port);

        const server = createServer(async (req, res) => {
          try {
            // Serve the playground HTML
            const htmlPath = join(__dirname, '..', '..', 'assets', 'playground.html');
            const html = await readFile(htmlPath, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading playground');
          }
        });

        server.listen(port, () => {
          spinner.succeed(chalk.green(`Playground running on http://localhost:${port}`));

          printInfo(chalk.blue('\n🌐 Ultra-Dex Web Playground\n'));
          printInfo(`  Local: ${chalk.cyan(`http://localhost:${port}`)}`);

          printInfo(chalk.gray('Features:'));
          printInfo('  • Create implementation plans from your browser');
          printInfo('  • Export to Markdown, JSON, or YAML');
          printInfo('  • Share via short links\n');



          printInfo(chalk.yellow('Press Ctrl+C to stop\n'));
        });

        // Keep process running
        await new Promise(() => {});

      } catch (error) {
        printError(`Failed to start playground: ${error.message}`);
        process.exit(1);
      }
    });
}
