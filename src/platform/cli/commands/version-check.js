// Copyright (c) 2026 Ultra-Dex

/**
 * Semantic Version Check Utility
 * Ensures project configuration alignment with CLI runtime
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function checkProjectVersion(options = {}) {
  try {
    // 1. Load CLI version from package.json
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const cliVersion = pkg.version;

    // 2. Load project config if exists
    const configPath = path.resolve(process.cwd(), '.ultra-dex/config.json');
    let projectVersion = '0.0.0';

    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      projectVersion = config.version || '3.3.0';
    } catch (e) {
      if (options.silent) return null;
      printWarning(chalk.yellow('No .ultra-dex/config.json found. Initialize a project first.'));
      return null;
    }

    // 3. Compare and warn
    if (options.json) {
      return { projectVersion, cliVersion, ok: projectVersion >= cliVersion };
    }

    if (projectVersion < cliVersion) {
      printWarning(chalk.yellow(`\n⚠️  Project configuration is outdated (v${projectVersion}).`));
      printWarning(chalk.yellow(`   Current Ultra-Dex CLI is v${cliVersion}.`));
      printInfo(
        chalk.cyan(
          '\n💡 Suggested action: run `ultra-dex config --reset` to align with latest standards.\n'
        )
      );
      return { projectVersion, cliVersion, ok: false };
    }

    printSuccess(chalk.green(`✅ Project config matches CLI version (${cliVersion})`));
    return { projectVersion, cliVersion, ok: true };
  } catch (error) {
    // Silent fail for version check
    if (!options.silent) {
      printWarning(chalk.yellow(`Version check failed: ${error.message}`));
    }
  }
}

export function registerVersionCheckCommand(program) {
  program
    .command('version-check')
    .description('Verify project config version against CLI version')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const result = await checkProjectVersion(options);
      if (options.json && result) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      }
    });
}

export default { checkProjectVersion, registerVersionCheckCommand };
