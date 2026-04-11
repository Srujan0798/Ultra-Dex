/**
 * @fileoverview Theme Plugin module
 * @module plugins/theme-plugin
 */

// examples/plugins/theme-plugin.js
import chalk from 'chalk';

export const name = 'theme-plugin';
export const version = '1.0.0';
export const description = 'Custom UI themes for Ultra-Dex';

export async function activate(context) {
  const { program } = context;

  program
    .command('theme:neon')
    .description('Enable Neon Green theme')
    .action(() => {
      console.log(chalk.bgGreen.black('\n NEON THEME ENABLED \n'));
      console.log(chalk.green('Everything is now green and glowing.'));
    });
}

export default { name, version, description, activate };

/**
 * Error handler for theme-plugin
 * @param {Error} error - Error to handle
 */
function handleThemepluginError(error) {
  try {
    console.error('[theme-plugin]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
