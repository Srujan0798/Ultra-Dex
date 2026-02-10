// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Credentials module
 * @module commands/credentials
 */

import chalk from 'chalk';
import { setCredential, listCredentials, deleteCredential } from '../security/keychain.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerCredentialsCommand(program) {
  const cmd = program.command('creds').description('Credential manager');

  cmd
    .command('set <name>')
    .description('Store a credential in the system keychain')
    .action(async (name) => {
      try {
        printInfo(`Enter value for ${name}:`);
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', async (data) => {
          const value = data.trim();
          await setCredential(name, value);
          printSuccess(chalk.green(`✅ Stored ${name}`));
          process.exit(0);
        });
      } catch (error) {
        printError(chalk.red(`Failed to store credential: ${error.message}`));
      }
    });

  cmd
    .command('list')
    .description('List stored credentials')
    .action(async () => {
      try {
        const keys = await listCredentials();
        if (!keys.length) {
          printInfo('No credentials stored.');
          return;
        }
        keys.forEach((k) => printInfo(`- ${k}`));
      } catch (error) {
        printError(chalk.red(`Failed to list credentials: ${error.message}`));
      }
    });

  cmd
    .command('rotate <name>')
    .description('Remove a credential so you can set a new one')
    .action(async (name) => {
      try {
        await deleteCredential(name);
        printSuccess(
          chalk.green(`✅ Removed ${name}. Re-run creds set ${name} to store new value.`)
        );
      } catch (error) {
        printError(chalk.red(`Failed to rotate credential: ${error.message}`));
      }
    });
}
