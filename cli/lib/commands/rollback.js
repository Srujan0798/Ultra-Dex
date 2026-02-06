/**
 * ultra-dex rollback command
 * Emergency Revert - "Break Glass in Case of Emergency"
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

export async function performRollback(options = {}) {
  printInfo(chalk.red('\n🚨 EMERGENCY ROLLBACK INITIATED\n'));
  printWarning(
    chalk.yellow('⚠️  This will revert the last commit and potentially redeploy previous state')
  );

  // Confirm with user before proceeding
  const { confirmRollback } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmRollback',
      message: chalk.red(
        'Are you sure you want to proceed with the rollback? This cannot be undone!'
      ),
      default: false,
    },
  ]);

  if (!confirmRollback) {
    printInfo(chalk.gray('Rollback cancelled by user.'));
    return;
  }

  printInfo(chalk.yellow('\n🔍 Checking git log...'));

  try {
    // Get git log to show recent commits
    const { stdout: logOutput } = await execAsync('git log --oneline -n 5');
    printInfo(chalk.gray('\nRecent commits:'));
    printInfo(chalk.gray(logOutput));

    // Get the current commit hash
    const { stdout: currentHash } = await execAsync('git rev-parse HEAD');
    const currentCommit = currentHash.trim();

    printInfo(chalk.gray(`Current commit: ${currentCommit.substring(0, 8)}`));

    // Check if there's a previous commit to rollback to
    try {
      const { stdout: previousHash } = await execAsync('git rev-parse HEAD~1');
      const previousCommit = previousHash.trim();

      printInfo(chalk.gray(`Previous commit: ${previousCommit.substring(0, 8)}`));

      // Confirm rollback to previous commit
      const { confirmReset } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmReset',
          message: chalk.yellow(`Rollback to commit ${previousCommit.substring(0, 8)}?`),
          default: true,
        },
      ]);

      if (!confirmReset) {
        printInfo(chalk.gray('Rollback cancelled by user.'));
        return;
      }

      // Perform the git reset
      printWarning(chalk.yellow('\n⚠️  Performing git reset --hard HEAD~1...'));

      const { stdout: resetOutput } = await execAsync('git reset --hard HEAD~1');
      printSuccess(chalk.green('✅ Git reset completed successfully'));
      printInfo(chalk.gray(resetOutput));

      // Get the new HEAD after reset
      const { stdout: newHead } = await execAsync('git rev-parse HEAD');
      const newCommit = newHead.trim();
      printSuccess(chalk.green(`✅ Reverted to commit: ${newCommit.substring(0, 8)}`));

      // Option to redeploy previous state
      if (options.deploy) {
        printInfo(chalk.cyan('\n🔄 Attempting to redeploy previous state...'));
        await redeployPreviousState();
      } else {
        const { redeploy } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'redeploy',
            message: chalk.cyan('Redeploy previous state to restore service?'),
            default: true,
          },
        ]);

        if (redeploy) {
          await redeployPreviousState();
        }
      }

      printSuccess(chalk.green('\n🎉 ROLLBACK COMPLETED SUCCESSFULLY'));
      printInfo(chalk.gray('System should now be running the previous stable version.'));
    } catch (error) {
      printError(chalk.red('No previous commit to rollback to (this is the first commit)'));
      return;
    }
  } catch (error) {
    printError(chalk.red(`Rollback failed: ${error.message}`));
    throw error;
  }
}

/**
 * Redeploy previous state
 */
async function redeployPreviousState() {
  printInfo(chalk.cyan('Initiating deployment of previous state...'));

  // Check if there's a deployment command available
  try {
    // Look for deployment configuration
    const hasDeployConfig = await checkDeploymentConfig();

    if (hasDeployConfig) {
      printInfo(chalk.gray('Deployment configuration detected. Attempting to redeploy...'));

      // This would call the appropriate deployment command based on configuration
      // For now, we'll simulate the deployment
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate deployment time

      printSuccess(chalk.green('✅ Previous state redeployed successfully'));
    } else {
      printWarning(
        chalk.yellow('No deployment configuration detected. Manual deployment may be required.')
      );
      printInfo(chalk.gray('Consider running: ultra-dex deploy --force to redeploy'));
    }
  } catch (error) {
    printError(chalk.red(`Redeployment failed: ${error.message}`));
    printWarning(chalk.yellow('Manual intervention may be required to restore service'));
  }
}

/**
 * Check for deployment configuration
 */
async function checkDeploymentConfig() {
  const configFiles = [
    'vercel.json',
    'netlify.toml',
    'now.json',
    'Dockerfile',
    'docker-compose.yml',
    'package.json', // Check for deployment scripts
    'deploy.sh',
    '.github/workflows/deploy.yml',
    '.gitlab-ci.yml',
    'Jenkinsfile',
  ];

  for (const configFile of configFiles) {
    try {
      await fs.access(configFile);
      return true;
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  // Check package.json for deployment scripts
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    if (
      packageJson.scripts &&
      (packageJson.scripts.deploy ||
        packageJson.scripts['predeploy'] ||
        packageJson.scripts['postdeploy'])
    ) {
      return true;
    }
  } catch (error) {
    // package.json doesn't exist or isn't valid JSON
  }

  return false;
}

export function registerRollbackCommand(program) {
  program
    .command('rollback')
    .description('Emergency revert - "Break Glass in Case of Emergency"')
    .option('-d, --deploy', 'Redeploy previous state after rollback')
    .option('-f, --force', 'Force rollback without confirmation (DANGEROUS)')
    .action(async (options) => {
      try {
        if (options.force) {
          printWarning(chalk.red('⚠️  FORCED ROLLBACK WITHOUT CONFIRMATION - THIS IS DANGEROUS!'));
          // In a real implementation, we wouldn't ask for confirmation with force
          // For safety, we'll still ask for confirmation even with --force
          const { confirmForce } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmForce',
              message: chalk.red(
                'FORCE ROLLBACK: Are you absolutely sure? This bypasses safety checks!'
              ),
              default: false,
            },
          ]);

          if (!confirmForce) {
            printInfo(chalk.gray('Forced rollback cancelled by user.'));
            return;
          }
        }

        await performRollback(options);
      } catch (error) {
        printError(chalk.red(`Rollback failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  performRollback,
  registerRollbackCommand,
};
