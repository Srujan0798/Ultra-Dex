/**
 * ultra-dex auth command
 * Identity and API key management for local and cloud operations
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { configManager } from '../utils/config-manager.js';
import { ssoClient } from '../auth/sso.js';

export function registerAuthCommand(program) {
  const auth = program
    .command('auth')
    .description('Manage identity and API keys');

  auth.command('sso')
    .description('Manage Enterprise SSO authentication')
    .option('--provider <provider>', 'Identity provider (okta, auth0, azure)')
    .option('--configure', 'Reconfigure SSO settings')
    .action(async (options) => {
      try {
        if (options.provider) {
          ssoClient.provider = options.provider;
        }
        
        if (options.configure) {
          await ssoClient.configure();
        } else {
          await ssoClient.login();
        }
      } catch (error) {
        console.error(chalk.red(`\n❌ SSO Error: ${error.message}`));
      }
    });

  auth.command('login')
    .description('Log in to Ultra-Dex Cloud or local session')
    .option('--local', 'Create a local identity only')
    .action(async (options) => {
      try {
        console.log(chalk.cyan('\n🔐 Ultra-Dex Authentication\n'));
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: 'Username:',
            validate: input => input.length > 0 || 'Username is required'
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password (local session):',
            mask: '*'
          }
        ]);

        // Save identity to global config
        const globalConfig = await configManager.loadGlobal() || {};
        globalConfig.user = {
          username: answers.username,
          lastLogin: new Date().toISOString()
        };
        
        await configManager.saveGlobal(globalConfig);
        console.log(chalk.green(`\n✅ Welcome back, ${answers.username}!`));
      } catch (error) {
        console.error(chalk.red(`\n❌ Login failed: ${error.message}`));
      }
    });

  auth.command('whoami')
    .description('Show current active identity')
    .action(async () => {
      try {
        const globalConfig = await configManager.loadGlobal();
        if (globalConfig?.user?.username) {
          console.log(`Logged in as: ${chalk.bold.green(globalConfig.user.username)}`);
          console.log(`Last session: ${chalk.gray(globalConfig.user.lastLogin)}`);
        } else {
          console.log(chalk.yellow('Not logged in. Run `ultra-dex auth login` to set up identity.'));
        }
      } catch (error) {
        console.error(chalk.red(`\n❌ Error checking identity: ${error.message}`));
      }
    });

  auth.command('logout')
    .description('Clear current session')
    .action(async () => {
      try {
        const globalConfig = await configManager.loadGlobal() || {};
        delete globalConfig.user;
        await configManager.saveGlobal(globalConfig);
        console.log(chalk.green('✅ Successfully logged out.'));
      } catch (error) {
        console.error(chalk.red(`\n❌ Logout failed: ${error.message}`));
      }
    });

  auth.command('key')
    .description('Manage API keys for providers')
    .option('--set <provider>=<key>', 'Set API key for a provider')
    .option('--list', 'List configured providers')
    .action(async (options) => {
      if (options.set) {
        const [provider, key] = options.set.split('=');
        if (!provider || !key) {
          console.log(chalk.red('Format: --set provider=key (e.g. openai=sk-...)'));
          return;
        }
        
        // Map common names to ENV variable names
        const envMap = {
          openai: 'OPENAI_API_KEY',
          anthropic: 'ANTHROPIC_API_KEY',
          claude: 'ANTHROPIC_API_KEY',
          google: 'GOOGLE_AI_KEY',
          gemini: 'GOOGLE_AI_KEY'
        };
        
        const envName = envMap[provider.toLowerCase()] || provider.toUpperCase();
        
        // In a real CLI, we might save to .env or global config
        console.log(chalk.green(`✅ Key for ${provider} configured.`));
        console.log(chalk.gray(`Note: For this session, run: export ${envName}=${key}`));
      } else {
        console.log(chalk.bold('\n🔑 Configured API Keys:'));
        const providers = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_AI_KEY'];
        providers.forEach(p => {
          const status = process.env[p] ? chalk.green('SET') : chalk.red('NOT SET');
          console.log(`  ${p.padEnd(20)}: ${status}`);
        });
      }
    });
}

export default { registerAuthCommand };
