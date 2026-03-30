// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex api command
 * CLI Gateway for External Tools (GitHub, Vercel, Stripe, etc.)
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

const execAsync = promisify(exec);

// Available integrations
const INTEGRATIONS = {
  github: {
    name: 'GitHub',
    description: 'GitHub API for repositories, issues, PRs',
    envVars: ['GITHUB_TOKEN', 'GITHUB_USERNAME'],
    testEndpoint: 'https://api.github.com/user',
    quotaCheck: async () => {
      // GitHub doesn't have a traditional quota system, but we can check rate limits
      try {
        const { stdout } = await execAsync(
          'curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit'
        );
        const rateLimit = JSON.parse(stdout);
        return {
          remaining: rateLimit.rate.remaining,
          limit: rateLimit.rate.limit,
          reset: new Date(rateLimit.rate.reset * 1000).toLocaleString(),
        };
      } catch (error) {
        return { error: error.message };
      }
    },
  },
  vercel: {
    name: 'Vercel',
    description: 'Vercel API for deployments, projects, teams',
    envVars: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID'],
    testEndpoint: 'https://api.vercel.com/v2/user',
    quotaCheck: async () => {
      try {
        const { stdout } = await execAsync(
          'curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user'
        );
        // Vercel doesn't have a simple quota endpoint, return basic info
        return { service: 'Vercel', type: 'deployment' };
      } catch (error) {
        return { error: error.message };
      }
    },
  },
  stripe: {
    name: 'Stripe',
    description: 'Stripe API for payments, customers, billing',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    testEndpoint: 'https://api.stripe.com/v1/account',
    quotaCheck: async () => {
      try {
        const { stdout } = await execAsync(
          'curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/balance'
        );
        // Stripe doesn't have a simple quota system, return basic account info
        return { service: 'Stripe', type: 'payment processing' };
      } catch (error) {
        return { error: error.message };
      }
    },
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Anthropic Claude API for AI models',
    envVars: ['ANTHROPIC_API_KEY'],
    testEndpoint: 'https://api.anthropic.com/v1/messages',
    quotaCheck: async () => {
      try {
        // This would require a proper request with headers
        // For now, we'll just check if the key is set
        const hasKey = process.env.ANTHROPIC_API_KEY;
        return {
          hasKey: !!hasKey,
          service: 'Anthropic',
          type: 'AI model access',
        };
      } catch (error) {
        return { error: error.message };
      }
    },
  },
  openai: {
    name: 'OpenAI',
    description: 'OpenAI API for GPT models',
    envVars: ['OPENAI_API_KEY'],
    testEndpoint: 'https://api.openai.com/v1/models',
    quotaCheck: async () => {
      try {
        const { stdout } = await execAsync(
          'curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models'
        );
        const data = JSON.parse(stdout);
        return {
          modelCount: data.data?.length || 0,
          service: 'OpenAI',
          type: 'AI model access',
        };
      } catch (error) {
        return { error: error.message };
      }
    },
  },
};

/**
 * List all available integrations
 */
export async function listIntegrations() {
  printSuccess(chalk.green('Available Integrations:\n'));

  for (const [key, integration] of Object.entries(INTEGRATIONS)) {
    const isConfigured = checkIntegrationConfigured(integration);

    printInfo(chalk.cyan(`${key} - ${integration.name}`));
    printInfo(chalk.gray(`  ${integration.description}`));
    printInfo(chalk.gray(`  Required vars: ${integration.envVars.join(', ')}`));
    printInfo(
      chalk.gray(
        `  Status: ${isConfigured ? chalk.green('CONFIGURED') : chalk.red('NOT CONFIGURED')}`
      )
    );
    logger.log('');
  }
}

/**
 * Test a specific integration
 */
export async function testIntegration(service) {
  const integration = INTEGRATIONS[service];

  if (!integration) {
    throw new Error(
      `Integration not found: ${service}. Available: ${Object.keys(INTEGRATIONS).join(', ')}`
    );
  }

  printInfo(chalk.cyan(`\n🧪 Testing ${integration.name} integration...\n`));

  // Check if required environment variables are set
  const missingVars = integration.envVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    printError(chalk.red(`Missing environment variables: ${missingVars.join(', ')}`));
    printInfo(chalk.gray(`Set these variables to configure ${integration.name}:`));
    missingVars.forEach((varName) => {
      printInfo(chalk.gray(`  export ${varName}="your_${varName.toLowerCase()}_here"`));
    });
    return;
  }

  printSuccess(chalk.green(`✅ Required environment variables are set`));

  // Test the endpoint
  try {
    printInfo(chalk.gray('Pinging API endpoint...'));

    // For simplicity, we'll use curl to test the endpoint
    // In a real implementation, we'd use the proper API client
    const cmd = `curl -s -o /dev/null -w "%{http_code}" -m 10 -H "Authorization: Bearer $${integration.envVars[0]}" ${integration.testEndpoint}`;
    const { stdout } = await execAsync(cmd);

    const statusCode = parseInt(stdout);

    if (statusCode >= 200 && statusCode < 300) {
      printSuccess(
        chalk.green(`✅ ${integration.name} API test successful (Status: ${statusCode})`)
      );
    } else {
      printError(chalk.red(`❌ ${integration.name} API test failed (Status: ${statusCode})`));
    }
  } catch (error) {
    printError(chalk.red(`❌ ${integration.name} API test failed: ${error.message}`));
  }
}

/**
 * Check integration configuration status
 */
function checkIntegrationConfigured(integration) {
  return integration.envVars.every((varName) => process.env[varName]);
}

/**
 * Show API usage/quota for connected LLMs
 */
export async function showApiStatus() {
  printSuccess(chalk.green('API Status & Quotas:\n'));

  // Check each integration that has quota checking capability
  for (const [key, integration] of Object.entries(INTEGRATIONS)) {
    if (integration.quotaCheck) {
      printInfo(chalk.cyan(`${integration.name} Status:`));

      if (!checkIntegrationConfigured(integration)) {
        printWarning(
          chalk.yellow(
            `  Not configured (missing env vars: ${integration.envVars.filter((v) => !process.env[v]).join(', ')})`
          )
        );
        continue;
      }

      try {
        const quotaInfo = await integration.quotaCheck();

        if (quotaInfo.error) {
          printError(chalk.red(`  Error checking quota: ${quotaInfo.error}`));
        } else {
          // Display quota information
          if (quotaInfo.remaining !== undefined) {
            printSuccess(
              chalk.green(`  Requests remaining: ${quotaInfo.remaining}/${quotaInfo.limit}`)
            );
            printInfo(chalk.gray(`  Resets at: ${quotaInfo.reset}`));
          } else {
            printInfo(chalk.gray(`  Status: ${JSON.stringify(quotaInfo, null, 2)}`));
          }
        }
      } catch (error) {
        printError(chalk.red(`  Error checking status: ${error.message}`));
      }
    }
    logger.log('');
  }

  // Show general API statistics
  printInfo(chalk.cyan('General API Info:'));
  printInfo(chalk.gray(`  Total Integrations: ${Object.keys(INTEGRATIONS).length}`));
  printInfo(
    chalk.gray(
      `  Configured Integrations: ${Object.values(INTEGRATIONS).filter((integration) => checkIntegrationConfigured(integration)).length}`
    )
  );
}

export function registerApiCommand(program) {
  const apiCmd = program.command('api').description('Gateway for external service integrations');

  apiCmd
    .command('list')
    .description('Show available integrations')
    .action(async () => {
      try {
        await listIntegrations();
      } catch (error) {
        printError(chalk.red(`List command failed: ${error.message}`));
      }
    });

  apiCmd
    .command('test')
    .description('Ping service to verify credentials')
    .argument('<service>', 'Service to test (github, vercel, stripe, etc.)')
    .action(async (service) => {
      try {
        await testIntegration(service);
      } catch (error) {
        printError(chalk.red(`Test command failed: ${error.message}`));
      }
    });

  apiCmd
    .command('status')
    .description('Show API usage/quota for connected LLMs')
    .action(async () => {
      try {
        await showApiStatus();
      } catch (error) {
        printError(chalk.red(`Status command failed: ${error.message}`));
      }
    });

  apiCmd._examples = [
    { command: 'ultra-dex api list', description: 'Show all available integrations' },
    { command: 'ultra-dex api test github', description: 'Test GitHub API connectivity' },
    { command: 'ultra-dex api test stripe', description: 'Test Stripe API connectivity' },
    { command: 'ultra-dex api status', description: 'Show API usage quotas' },
  ];
}

export default {
  listIntegrations,
  testIntegration,
  showApiStatus,
  registerApiCommand,
};
