// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex cloud command
 * Cloud deployment wrapper for Vercel, Railway, Fly.io
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

export function registerCloudCommand(program) {
  const cloudCmd = program
    .command('cloud')
    .description('Cloud deployment management (Vercel, Railway, Fly.io)');

  cloudCmd
    .command('deploy')
    .description('Deploy project to cloud provider')
    .option('-p, --provider <provider>', 'Cloud provider (vercel, railway, fly)', 'vercel')
    .option('-d, --dir <directory>', 'Project directory to deploy', '.')
    .option('--prod', 'Deploy to production environment')
    .option('--preview', 'Deploy to preview/staging environment')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n☁️  Ultra-Dex Cloud Deployment\n'));

        const dirValidation = validateSafePath(options.dir, 'Project directory');
        if (dirValidation !== true) {
          printError(chalk.red(dirValidation));
          process.exit(1);
        }

        const projectDir = path.resolve(options.dir);

        // Validate project directory exists
        try {
          await fs.access(projectDir);
        } catch (error) {
          printError(chalk.red(`Project directory does not exist: ${projectDir}`));
          process.exit(1);
        }

        // Validate provider
        const validProviders = ['vercel', 'railway', 'fly'];
        if (!validProviders.includes(options.provider)) {
          printError(
            chalk.red(
              `Invalid provider: ${options.provider}. Valid options: ${validProviders.join(', ')}`
            )
          );
          process.exit(1);
        }

        printInfo(chalk.gray(`Deploying from: ${projectDir}`));
        printInfo(chalk.gray(`Provider: ${options.provider}`));

        if (options.prod) {
          printInfo(chalk.gray('Environment: Production'));
        } else if (options.preview) {
          printInfo(chalk.gray('Environment: Preview/Staging'));
        } else {
          printInfo(chalk.gray('Environment: Default'));
        }

        // Change to project directory
        const originalDir = process.cwd();
        process.chdir(projectDir);

        try {
          await deployToProvider(options.provider, {
            prod: options.prod,
            preview: options.preview,
          });
        } finally {
          // Restore original directory
          process.chdir(originalDir);
        }
      } catch (error) {
        printError(chalk.red(`Cloud deployment failed: ${error.message}`));
        process.exit(1);
      }
    });

  cloudCmd
    .command('status')
    .description('Check deployment status')
    .option('-p, --provider <provider>', 'Cloud provider (vercel, railway, fly)', 'vercel')
    .option('-d, --dir <directory>', 'Project directory', '.')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n☁️  Ultra-Dex Cloud Status\n'));

        const dirValidation = validateSafePath(options.dir, 'Project directory');
        if (dirValidation !== true) {
          printError(chalk.red(dirValidation));
          process.exit(1);
        }

        const projectDir = path.resolve(options.dir);

        // Validate project directory exists
        try {
          await fs.access(projectDir);
        } catch (error) {
          printError(chalk.red(`Project directory does not exist: ${projectDir}`));
          process.exit(1);
        }

        // Validate provider
        const validProviders = ['vercel', 'railway', 'fly'];
        if (!validProviders.includes(options.provider)) {
          printError(
            chalk.red(
              `Invalid provider: ${options.provider}. Valid options: ${validProviders.join(', ')}`
            )
          );
          process.exit(1);
        }

        printInfo(chalk.gray(`Checking status for: ${projectDir}`));
        printInfo(chalk.gray(`Provider: ${options.provider}`));

        // Change to project directory
        const originalDir = process.cwd();
        process.chdir(projectDir);

        try {
          await checkProviderStatus(options.provider);
        } finally {
          // Restore original directory
          process.chdir(originalDir);
        }
      } catch (error) {
        printError(chalk.red(`Cloud status check failed: ${error.message}`));
        process.exit(1);
      }
    });

  cloudCmd
    .command('login')
    .description('Login to cloud provider')
    .option('-p, --provider <provider>', 'Cloud provider (vercel, railway, fly)', 'vercel')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n☁️  Ultra-Dex Cloud Login\n'));

        // Validate provider
        const validProviders = ['vercel', 'railway', 'fly'];
        if (!validProviders.includes(options.provider)) {
          printError(
            chalk.red(
              `Invalid provider: ${options.provider}. Valid options: ${validProviders.join(', ')}`
            )
          );
          process.exit(1);
        }

        printInfo(chalk.gray(`Logging into: ${options.provider}`));

        await loginToProvider(options.provider);
      } catch (error) {
        printError(chalk.red(`Cloud login failed: ${error.message}`));
        process.exit(1);
      }
    });

  cloudCmd._examples = [
    { command: 'ultra-dex cloud deploy', description: 'Deploy to Vercel (default)' },
    { command: 'ultra-dex cloud deploy --provider railway', description: 'Deploy to Railway' },
    {
      command: 'ultra-dex cloud deploy --provider fly --prod',
      description: 'Deploy to Fly.io production',
    },
    { command: 'ultra-dex cloud status', description: 'Check deployment status' },
    { command: 'ultra-dex cloud login --provider vercel', description: 'Login to Vercel' },
  ];
}

/**
 * Deploy to the specified provider
 */
async function deployToProvider(provider, options = {}) {
  printInfo(chalk.yellow(`Initiating deployment to ${provider}...`));

  try {
    switch (provider) {
      case 'vercel':
        await deployToVercel(options);
        break;
      case 'railway':
        await deployToRailway(options);
        break;
      case 'fly':
        await deployToFly(options);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    printSuccess(chalk.green(`✅ Successfully deployed to ${provider}`));
  } catch (error) {
    printError(chalk.red(`Deployment to ${provider} failed: ${error.message}`));
    throw error;
  }
}

/**
 * Deploy to Vercel
 */
async function deployToVercel(options) {
  try {
    // Check if vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    printError(chalk.red('Vercel CLI not found. Please install with: npm install -g vercel'));
    printInfo(chalk.gray('Or visit: https://vercel.com/cli'));
    throw new Error('Vercel CLI not installed');
  }

  // Prepare deployment command
  let command = 'vercel';

  if (options.prod) {
    command += ' --prod';
  } else if (options.preview) {
    command += ' --prebuilt'; // Use prebuilt for preview
  } else {
    command += ' --prebuilt'; // Default to preview
  }

  printInfo(chalk.gray(`Running: ${command}`));

  // Execute deployment
  const result = execSync(command, { stdio: 'inherit' });
  return result;
}

/**
 * Deploy to Railway
 */
async function deployToRailway(options) {
  try {
    // Check if railway CLI is installed
    execSync('railway --version', { stdio: 'pipe' });
  } catch (error) {
    printError(
      chalk.red('Railway CLI not found. Please install with: npm install -g @railway/cli')
    );
    printInfo(chalk.gray('Or visit: https://railway.app/cli'));
    throw new Error('Railway CLI not installed');
  }

  // Prepare deployment command
  let command = 'railway up';

  if (options.prod) {
    command += ' --environment production';
  } else if (options.preview) {
    command += ' --environment preview';
  }

  printInfo(chalk.gray(`Running: ${command}`));

  // Execute deployment
  const result = execSync(command, { stdio: 'inherit' });
  return result;
}

/**
 * Deploy to Fly.io
 */
async function deployToFly(options) {
  try {
    // Check if fly CLI is installed
    execSync('fly --version', { stdio: 'pipe' });
  } catch (error) {
    printError(
      chalk.red(
        'Fly.io CLI not found. Please install from: https://fly.io/docs/getting-started/installing-flyctl/'
      )
    );
    throw new Error('Fly.io CLI not installed');
  }

  // Prepare deployment command
  let command = 'fly deploy';

  if (options.prod) {
    // For production, we might want to specify the app
    command += ' --detach'; // Run in background
  } else if (options.preview) {
    // For preview, we might use a different app or deploy to staging
    command += ' --build-arg ENV=staging';
  }

  printInfo(chalk.gray(`Running: ${command}`));

  // Execute deployment
  const result = execSync(command, { stdio: 'inherit' });
  return result;
}

/**
 * Check status of the provider
 */
async function checkProviderStatus(provider) {
  printInfo(chalk.yellow(`Checking status for ${provider}...`));

  try {
    switch (provider) {
      case 'vercel':
        await checkVercelStatus();
        break;
      case 'railway':
        await checkRailwayStatus();
        break;
      case 'fly':
        await checkFlyStatus();
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    printError(chalk.red(`Status check for ${provider} failed: ${error.message}`));
    throw error;
  }
}

/**
 * Check Vercel status
 */
async function checkVercelStatus() {
  try {
    // Check if vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' });

    const output = execSync('vercel projects', { encoding: 'utf8' });
    printInfo(chalk.gray('Vercel projects:'));
    printInfo(chalk.gray(output));
  } catch (error) {
    printError(chalk.red('Could not retrieve Vercel status'));
    throw error;
  }
}

/**
 * Check Railway status
 */
async function checkRailwayStatus() {
  try {
    // Check if railway CLI is installed
    execSync('railway --version', { stdio: 'pipe' });

    const output = execSync('railway status', { encoding: 'utf8' });
    printInfo(chalk.gray('Railway status:'));
    printInfo(chalk.gray(output));
  } catch (error) {
    printError(chalk.red('Could not retrieve Railway status'));
    throw error;
  }
}

/**
 * Check Fly.io status
 */
async function checkFlyStatus() {
  try {
    // Check if fly CLI is installed
    execSync('fly --version', { stdio: 'pipe' });

    const output = execSync('fly status', { encoding: 'utf8' });
    printInfo(chalk.gray('Fly.io status:'));
    printInfo(chalk.gray(output));
  } catch (error) {
    printError(chalk.red('Could not retrieve Fly.io status'));
    throw error;
  }
}

/**
 * Login to provider
 */
async function loginToProvider(provider) {
  printInfo(chalk.yellow(`Logging in to ${provider}...`));

  try {
    switch (provider) {
      case 'vercel':
        execSync('vercel login', { stdio: 'inherit' });
        break;
      case 'railway':
        execSync('railway login', { stdio: 'inherit' });
        break;
      case 'fly':
        execSync('fly auth login', { stdio: 'inherit' });
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    printSuccess(chalk.green(`✅ Successfully logged in to ${provider}`));
  } catch (error) {
    printError(chalk.red(`Login to ${provider} failed: ${error.message}`));
    throw error;
  }
}

export default {
  registerCloudCommand,
};
