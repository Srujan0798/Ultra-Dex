// cli/lib/commands/upgrade.js
import chalk from 'chalk';
import { execSync } from 'child_process';

export async function upgradeCommand(options) {
  console.log(chalk.cyan.bold('\n⬆️  Ultra-Dex Upgrade Check\n'));

  try {
    // In a real environment, this checks npm
    const current = execSync('npm show ultra-dex version', { encoding: 'utf-8' }).trim();
    
    // Get local version from package.json
    const local = "2.4.0"; // Hardcoded for now as per plan's target
    
    console.log(`  Local:  ${local}`);
    console.log(`  Latest: ${current}`);
    
    if (local !== current) {
      console.log(chalk.yellow('\n  Update available!'));
      console.log(chalk.gray('  Run: npm install -g ultra-dex@latest'));
    } else {
      console.log(chalk.green('\n  ✅ You are up to date!'));
    }
  } catch (e) {
    console.log(chalk.yellow('  Note: Could not reach npm registry or ultra-dex not yet published.'));
    console.log(chalk.gray('  Current version: 2.4.0'));
  }
}
