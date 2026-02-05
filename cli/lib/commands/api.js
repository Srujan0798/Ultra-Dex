/**
 * ultra-dex api command
 * Starts the Cloud API Gateway.
 */

import chalk from 'chalk';
import { startApiGateway } from '../api/gateway.js';
import { printError, printInfo, printSuccess } from '../utils/output.js';

export function registerApiCommand(program) {
  const api = program
    .command('api')
    .description('Ultra-Dex Cloud API Gateway');

  api
    .command('start')
    .description('Start the API gateway server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('--no-auth', 'Disable API key authentication')
    .action(async (options) => {
      try {
        const port = parseInt(options.port, 10);
        if (Number.isNaN(port) || port < 1 || port > 65535) {
          printError(chalk.red('❌ Invalid port number. Must be between 1 and 65535.'));
          return;
        }

        printInfo(chalk.bold(`\n🚀 Starting Ultra-Dex API Gateway on port ${port}...`));
        await startApiGateway({ port, requireAuth: options.auth });
        printSuccess(chalk.green(`✅ API Gateway running at http://localhost:${port}`));
      } catch (error) {
        printError(chalk.red(`❌ Failed to start API gateway: ${error.message}`));
      }
    });
}

export default { registerApiCommand };
