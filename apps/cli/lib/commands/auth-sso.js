// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Auth Sso module
 * @module commands/auth-sso
 */

import chalk from 'chalk';
import { ssoClient, configureSso, loginSso } from '../auth/sso/index.js';
import { configManager } from '../utils/config-manager.js';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerAuthSsoCommand(program) {
  program
    .command('auth-sso')
    .description('Enterprise SSO configuration and login')
    .option('--provider <provider>', 'SSO provider (okta, auth0, azure, google)')
    .option('--mode <mode>', 'Protocol mode (oidc | saml)')
    .option('--setup', 'Run SSO setup wizard')
    .option('--login', 'Start SSO login flow')
    .option('--status', 'Show current SSO configuration')
    .action(async (options) => {
      try {
        if (options.provider) ssoClient.provider = options.provider;
        if (options.mode) ssoClient.mode = options.mode;

        if (options.setup) {
          await configureSso({ mode: options.mode });
          return;
        }

        if (options.login) {
          await loginSso();
          return;
        }

        if (options.status) {
          const config = await configManager.loadGlobal();
          if (!config?.sso) {
            printInfo(chalk.gray('SSO not configured. Run: ultra-dex auth-sso --setup'));
            return;
          }
          printSuccess(chalk.green('SSO configuration loaded:'));
          logger.log(JSON.stringify(config.sso, null, 2));
          return;
        }

        printInfo(chalk.gray('Usage: ultra-dex auth-sso --setup | --login | --status'));
      } catch (error) {
        await handleError(error, { command: 'auth-sso', options });
        printError(chalk.red(`SSO command failed: ${error.message}`));
      }
    });
}

export default {
  registerAuthSsoCommand,
};
