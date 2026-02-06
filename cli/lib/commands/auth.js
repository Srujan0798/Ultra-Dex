// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex auth command
 * Identity and API key management for local and cloud operations
 * Enterprise features: SSO, API keys, RBAC, Audit Logging
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { configManager } from '../utils/config-manager.js';
import { ssoClient } from '../auth/sso.js';
import { ROLES, hasPermission, getRoleDefinition } from '../auth/rbac.js';
import { apiKeyManager, manageAPIKeys } from '../auth/api-keys.js';
import { auditLogger } from '../auth/audit.js';
import { secureTokenStorage } from '../auth/token-storage.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import Table from 'cli-table3';

export function registerAuthCommand(program) {
  const auth = program
    .command('auth')
    .description('Manage identity, SSO, API keys, RBAC, and audit logs');

  // SSO command
  auth
    .command('sso')
    .description('Manage Enterprise SSO authentication')
    .option('--provider <provider>', 'Identity provider (okta, auth0, azure)')
    .option('--configure', 'Reconfigure SSO settings')
    .option('--wizard', 'Run SSO/SAML configuration wizard')
    .option('--saml', 'Configure SAML provider')
    .option('--oidc', 'Configure OIDC provider')
    .option('--login', 'Log in via SSO')
    .action(async (options) => {
      try {
        if (options.provider) {
          ssoClient.provider = options.provider;
        }

        if (options.configure || options.wizard || options.saml || options.oidc) {
          const mode = options.saml ? 'saml' : options.oidc ? 'oidc' : undefined;
          await ssoClient.configureWizard({ mode });
        } else if (options.login || (!options.configure && !options.wizard)) {
          await ssoClient.login();
        }
      } catch (error) {
        printError(chalk.red(`\n❌ SSO Error: ${error.message}`));
      }
    });

  // Login command
  auth
    .command('login')
    .description('Log in to Ultra-Dex Cloud or local session')
    .option('--local', 'Create a local identity only')
    .option('--sso', 'Log in via SSO')
    .action(async (options) => {
      try {
        if (options.sso) {
          await ssoClient.login();
          return;
        }

        printInfo(chalk.cyan('\n🔐 Ultra-Dex Authentication\n'));

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: 'Username:',
            validate: (input) => input.length > 0 || 'Username is required',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password (local session):',
            mask: '*',
          },
        ]);

        // Save identity to global config
        const globalConfig = (await configManager.loadGlobal()) || {};
        globalConfig.user = {
          username: answers.username,
          role: 'member',
          lastLogin: new Date().toISOString(),
        };

        await configManager.saveGlobal(globalConfig);

        // Log to audit
        await auditLogger.log({
          type: 'user_login',
          user: answers.username,
          status: 'success',
          details: { method: 'local' },
        });

        printSuccess(chalk.green(`\n✅ Welcome back, ${answers.username}!`));
      } catch (error) {
        printError(chalk.red(`\n❌ Login failed: ${error.message}`));
      }
    });

  // Whoami command
  auth
    .command('whoami')
    .description('Show current active identity')
    .action(async () => {
      try {
        const globalConfig = await configManager.loadGlobal();
        if (globalConfig?.user?.username) {
          console.log(`Logged in as: ${chalk.bold.green(globalConfig.user.username)}`);
          console.log(`Role: ${chalk.cyan(globalConfig.user.role || 'member')}`);
          console.log(`Last session: ${chalk.gray(globalConfig.user.lastLogin)}`);
        } else {
          printWarning(
            chalk.yellow('Not logged in. Run `ultra-dex auth login` to set up identity.')
          );
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Error checking identity: ${error.message}`));
      }
    });

  // Logout command
  auth
    .command('logout')
    .description('Clear current session')
    .action(async () => {
      try {
        const globalConfig = (await configManager.loadGlobal()) || {};
        const username = globalConfig.user?.username;

        delete globalConfig.user;
        await configManager.saveGlobal(globalConfig);

        // Log to audit
        if (username) {
          await auditLogger.log({
            type: 'user_logout',
            user: username,
            status: 'success',
          });
        }

        printSuccess(chalk.green('✅ Successfully logged out.'));
      } catch (error) {
        printError(chalk.red(`\n❌ Logout failed: ${error.message}`));
      }
    });

  // API Key management
  auth
    .command('key')
    .description('Manage API keys')
    .option('--create', 'Create a new API key')
    .option('--list', 'List all API keys')
    .option('--revoke <id>', 'Revoke an API key')
    .option('--interactive', 'Interactive API key management')
    .action(async (options) => {
      try {
        if (options.interactive || (!options.create && !options.list && !options.revoke)) {
          await manageAPIKeys();
          return;
        }

        if (options.create) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Key name:',
              validate: (input) => input.length > 0 || 'Name is required',
            },
            {
              type: 'checkbox',
              name: 'permissions',
              message: 'Select permissions:',
              choices: [
                { name: 'Read', value: 'read', checked: true },
                { name: 'Write', value: 'write' },
                { name: 'Delete', value: 'delete' },
                { name: 'Admin', value: 'admin' },
              ],
            },
          ]);

          const key = apiKeyManager.generateKey(answers.name, {
            permissions: answers.permissions,
          });

          printSuccess(chalk.green('\n✅ API Key created successfully!'));
          printWarning(chalk.yellow('\n⚠️  Copy your API key now - it will not be shown again!\n'));
          console.log(chalk.cyan(key.key));
          console.log(chalk.gray(`\nKey ID: ${key.id}`));
        }

        if (options.list) {
          const keys = apiKeyManager.listKeys();
          if (keys.length === 0) {
            printWarning(chalk.yellow('No API keys found'));
          } else {
            const table = new Table({
              head: ['Name', 'Prefix', 'Created', 'Last Used', 'Status'],
              style: { head: ['cyan'] },
            });

            keys.forEach((key) => {
              table.push([
                key.name,
                key.prefix,
                new Date(key.createdAt).toLocaleDateString(),
                key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never',
                key.enabled ? chalk.green('Active') : chalk.red('Revoked'),
              ]);
            });

            console.log(table.toString());
          }
        }

        if (options.revoke) {
          const result = apiKeyManager.revokeKey(options.revoke);
          if (result.success) {
            printSuccess(chalk.green('✅ API key revoked'));
          } else {
            printError(chalk.red(`Failed to revoke: ${result.error}`));
          }
        }
      } catch (error) {
        printError(chalk.red(`\n❌ API key error: ${error.message}`));
      }
    });

  // RBAC Roles command
  auth
    .command('roles')
    .description('Manage RBAC roles and permissions')
    .option('--list', 'List all roles')
    .option('--check <role>', 'Check permissions for a role')
    .option('--assign <user>', 'Assign role to user')
    .action(async (options) => {
      try {
        if (options.list || (!options.check && !options.assign)) {
          printInfo(chalk.cyan.bold('\n📋 Available Roles\n'));

          Object.entries(ROLES).forEach(([key, role]) => {
            const definition = getRoleDefinition(role);
            console.log(chalk.white.bold(`${key}:`));
            console.log(chalk.gray(`  Role: ${role}`));
            console.log(chalk.gray(`  Permissions (${definition.permissions.length}):`));
            definition.permissions.forEach((perm) => {
              console.log(chalk.gray(`    • ${perm}`));
            });
            console.log('');
          });
        }

        if (options.check) {
          const definition = getRoleDefinition(options.check);
          printInfo(chalk.cyan.bold(`\n🔍 Role: ${options.check}\n`));
          console.log(chalk.white('Permissions:'));
          definition.permissions.forEach((perm) => {
            console.log(chalk.gray(`  ✓ ${perm}`));
          });
        }

        if (options.assign) {
          const { role } = await inquirer.prompt([
            {
              type: 'list',
              name: 'role',
              message: `Select role for ${options.assign}:`,
              choices: Object.values(ROLES),
            },
          ]);

          const globalConfig = (await configManager.loadGlobal()) || {};
          if (!globalConfig.userRoles) globalConfig.userRoles = {};

          globalConfig.userRoles[options.assign] = role;
          await configManager.saveGlobal(globalConfig);

          printSuccess(chalk.green(`✅ Assigned ${role} role to ${options.assign}`));

          // Audit log
          await auditLogger.log({
            type: 'role_assignment',
            user: options.assign,
            details: { role, assignedBy: globalConfig.user?.username },
            status: 'success',
          });
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Role management error: ${error.message}`));
      }
    });

  // Audit log command
  auth
    .command('audit')
    .description('View and manage audit logs')
    .option('--view', 'View recent audit logs')
    .option('--stats', 'Show audit statistics')
    .option('--export <file>', 'Export logs to file')
    .option('--user <user>', 'Filter by user')
    .option('--action <action>', 'Filter by action')
    .option('--days <n>', 'Number of days to view', '7')
    .action(async (options) => {
      try {
        if (options.stats) {
          const stats = await auditLogger.getStats(parseInt(options.days));

          printInfo(chalk.cyan.bold(`\n📊 Audit Statistics (Last ${options.days} days)\n`));
          console.log(chalk.white(`Total Actions: ${stats.totalActions}`));

          if (Object.keys(stats.byAction).length > 0) {
            console.log(chalk.white('\nBy Action:'));
            Object.entries(stats.byAction)
              .sort((a, b) => b[1] - a[1])
              .forEach(([action, count]) => {
                console.log(chalk.gray(`  ${action}: ${count}`));
              });
          }

          if (Object.keys(stats.byStatus).length > 0) {
            console.log(chalk.white('\nBy Status:'));
            Object.entries(stats.byStatus).forEach(([status, count]) => {
              const color = status === 'success' ? 'green' : 'red';
              console.log(chalk[color](`  ${status}: ${count}`));
            });
          }
        }

        if (options.view || (!options.stats && !options.export)) {
          const filters = {
            limit: 50,
            startDate: new Date(
              Date.now() - parseInt(options.days) * 24 * 60 * 60 * 1000
            ).toISOString(),
          };

          if (options.user) filters.user = options.user;
          if (options.action) filters.action = options.action;

          const logs = await auditLogger.query(filters);

          printInfo(chalk.cyan.bold(`\n📝 Recent Audit Logs (${logs.length} entries)\n`));

          if (logs.length === 0) {
            printWarning(chalk.yellow('No audit logs found'));
          } else {
            const table = new Table({
              head: ['Timestamp', 'Action', 'User', 'Status'],
              style: { head: ['cyan'] },
              colWidths: [25, 20, 20, 15],
            });

            logs.forEach((log) => {
              const status = log.status === 'success' ? chalk.green('✓') : chalk.red('✗');
              table.push([
                new Date(log.timestamp).toLocaleString(),
                log.action,
                log.user || 'system',
                status,
              ]);
            });

            console.log(table.toString());
          }
        }

        if (options.export) {
          try {
            const result = await auditLogger.export('json', options.export);
            printSuccess(chalk.green(`✅ Exported ${result.exported} logs to ${options.export}`));
          } catch (err) {
            printError(chalk.red(`Export failed: ${err.message}`));
          }
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Audit error: ${error.message}`));
      }
    });

  // Secure storage command
  auth
    .command('secure-storage')
    .description('Manage secure token storage')
    .option('--list', 'List stored accounts')
    .option('--clear', 'Clear all stored tokens')
    .action(async (options) => {
      try {
        await secureTokenStorage.initialize();

        if (options.list || !options.clear) {
          const result = await secureTokenStorage.listAccounts();
          if (result.success && result.accounts.length > 0) {
            printInfo(chalk.cyan.bold('\n🔐 Stored Accounts\n'));
            result.accounts.forEach((acc) => {
              console.log(chalk.white(`  • ${acc.account}`));
            });
          } else {
            printInfo(chalk.gray('No accounts stored'));
          }
        }

        if (options.clear) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Clear all stored tokens?',
              default: false,
            },
          ]);

          if (confirm) {
            const result = await secureTokenStorage.listAccounts();
            if (result.success) {
              for (const acc of result.accounts) {
                await secureTokenStorage.deleteToken(acc.account);
              }
              printSuccess(chalk.green('✅ All tokens cleared'));
            }
          }
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Storage error: ${error.message}`));
      }
    });
}

export default { registerAuthCommand };
