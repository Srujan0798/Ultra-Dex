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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerPlaygroundCommand(program) {
  program
    .command('playground')
    .description('Launch web-based implementation plan editor')
    .option('-p, --port <port>', 'Port to run on', '3456')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      const spinner = ora('Starting Ultra-Dex Playground...').start();
      
      try {
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
          
          console.log(chalk.blue('\n🌐 Ultra-Dex Web Playground\n'));
          console.log(`  Local: ${chalk.cyan(`http://localhost:${port}`)}`);
          console.log(`  Network: ${chalk.cyan(`http://0.0.0.0:${port}`)}\n`);
          
          console.log(chalk.gray('Features:'));
          console.log('  • Create implementation plans from your browser');
          console.log('  • Export to Markdown, JSON, or YAML');
          console.log('  • Share via short links\n');
          

          
          console.log(chalk.yellow('Press Ctrl+C to stop\n'));
        });
        
        // Keep process running
        await new Promise(() => {});
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to start playground: ${error.message}`));
        process.exit(1);
      }
    });
}
