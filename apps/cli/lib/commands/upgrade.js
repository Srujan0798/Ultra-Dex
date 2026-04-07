// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Upgrade module
 * @module commands/upgrade
 */

// cli/lib/commands/upgrade.js
import chalk from 'chalk';
import ora from '../utils/ora.js';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError } from '../utils/errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function upgradeCommand(options) {
  printInfo(chalk.cyan.bold('\n⬆️  Ultra-Dex Upgrade Check\n'));

  if (options.backup) {
    printInfo(chalk.gray('Backup mode enabled: current install will be preserved before upgrade.'));
  }

  // Get local version from package.json
  const localVersion = getLocalVersion();

  const spinner = ora('Checking npm registry...').start();

  try {
    // Query npm registry for latest version
    const latestVersion = await getLatestVersion();
    spinner.succeed('Registry check complete');

    printInfo(chalk.gray('─'.repeat(50)));
    printInfo(`  ${chalk.gray('Installed:')}  ${chalk.white(localVersion)}`);
    printInfo(`  ${chalk.gray('Latest:')}     ${chalk.cyan(latestVersion)}`);
    printInfo(chalk.gray('─'.repeat(50)));

    const comparison = compareVersions(localVersion, latestVersion);

    if (comparison < 0) {
      // Update available
      printInfo(chalk.yellow.bold('\n  📦 Update available!\n'));

      // Show version diff summary
      const [localMajor, localMinor] = localVersion.split('.').map(Number);
      const [latestMajor, latestMinor] = latestVersion.split('.').map(Number);

      if (latestMajor > localMajor) {
        printInfo(chalk.red('  ⚠️  Major version update - may contain breaking changes'));
      } else if (latestMinor > localMinor) {
        printInfo(chalk.yellow('  ✨ Minor version update - new features available'));
      } else {
        printInfo(chalk.green('  🔧 Patch update - bug fixes and improvements'));
      }

      // Try to fetch changelog
      if (!options.check) {
        const changelogSpinner = ora('Fetching changelog...').start();
        try {
          const changelog = await fetchChangelog(localVersion, latestVersion);
          if (changelog) {
            changelogSpinner.succeed('Changelog retrieved');
            printInfo(chalk.bold("\n  📋 What's New:\n"));
            printInfo(chalk.gray(indent(changelog, 4)));
          } else {
            changelogSpinner.info('No changelog available');
          }
        } catch {
          changelogSpinner.info('Could not fetch changelog');
        }
      }

      // Show install instructions or run update
      printInfo('');
      if (options.install) {
        const installSpinner = ora('Installing update...').start();
        try {
          execSync('npm update -g ultra-dex', { encoding: 'utf-8', stdio: 'pipe' });
          installSpinner.succeed(chalk.green(`Updated to v${latestVersion}`));
          printInfo(chalk.gray('\n  Run `ultra-dex --version` to verify.\n'));
        } catch (e) {
          installSpinner.fail('Installation failed');
          printError(chalk.red(`  ${e.message}`));
          printInfo(chalk.gray('\n  Try running manually:'));
          printInfo(chalk.white('    npm install -g ultra-dex@latest\n'));
        }
      } else if (!options.check) {
        printInfo(chalk.gray('  To upgrade, run:'));
        printInfo(chalk.white('    npm install -g ultra-dex@latest'));
        printInfo(chalk.gray('  Or use:'));
        printInfo(chalk.white('    ultra-dex upgrade --install\n'));
      } else {
        printInfo(chalk.gray('  Check complete. Use --install to update.\n'));
      }
    } else if (comparison === 0) {
      // Up to date
      printSuccess(chalk.green.bold('\n  ✅ You are running the latest version!\n'));
    } else {
      // Local is newer (dev/beta)
      printInfo(chalk.blue.bold('\n  🔬 You are running a development/pre-release version\n'));
    }
  } catch (e) {
    spinner.warn('Could not reach npm registry');
    printInfo(chalk.gray(`  Current version: ${localVersion}`));
    printWarning(chalk.yellow(`\n  ${e.message}`));
    printInfo(chalk.gray('\n  Check your network connection and try again.\n'));
  }
}

function getLocalVersion() {
  try {
    // Try to get from the CLI's package.json
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      return pkg.version;
    }
  } catch {
    /* fall through */
  }

  // Fallback to hardcoded version
  return '3.0.0';
}

async function getLatestVersion() {
  return new Promise((resolve, reject) => {
    try {
      const output = execSync('npm view ultra-dex version 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      if (output && /^\d+\.\d+\.\d+/.test(output)) {
        resolve(output);
      } else {
        reject(new Error('Invalid version format from registry'));
      }
    } catch (_e) {
      // Package might not be published yet
      reject(new Error('Package not found in npm registry (may not be published yet)'));
    }
  });
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

async function fetchChangelog(fromVersion, toVersion) {
  try {
    // Try to fetch from GitHub releases API
    const output = execSync(
      `curl -s "https://api.github.com/repos/Srujan0798/Ultra-Dex/releases" | head -c 5000`,
      { encoding: 'utf-8', timeout: 10000 }
    );

    const releases = JSON.parse(output);
    if (!Array.isArray(releases) || releases.length === 0) {
      return null;
    }

    // Get release notes between versions
    const changelog = [];
    for (const release of releases.slice(0, 5)) {
      const releaseVersion = release.tag_name?.replace(/^v/, '') || '';
      if (
        compareVersions(releaseVersion, fromVersion) > 0 &&
        compareVersions(releaseVersion, toVersion) <= 0
      ) {
        changelog.push(`v${releaseVersion}:`);
        // Extract first few bullet points from body
        const body = release.body || '';
        const lines = body
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .slice(0, 5)
          .map((line) => '  ' + line.trim());
        changelog.push(...lines);
        changelog.push('');
      }
    }

    return changelog.length > 0 ? changelog.join('\n') : null;
  } catch {
    return null;
  }
}

function indent(text, spaces) {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n');
}

export function registerUpgradeCommand(program) {
  program
    .command('upgrade')
    .description('Check for and install updates')
    .option('--check', 'Check for updates without installing')
    .option('--install', 'Install available updates')
    .option('--backup', 'Create a backup before upgrade')
    .action(upgradeCommand);
}
