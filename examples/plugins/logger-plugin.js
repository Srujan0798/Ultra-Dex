// examples/plugins/logger-plugin.js
export const name = 'logger-plugin';
export const version = '1.0.0';
export const description = 'Advanced logging for Ultra-Dex events';
export const author = 'Ultra-Dex Team';

/**
 * Activation function
 * @param {Object} context - Plugin context
 */
export async function activate(context) {
  const { program, pluginManager } = context;

  console.log('Logger Plugin: Activated');

  // Register a hook listener
  pluginManager.registerHook('project-init', (data) => {
    console.log(`[LOGGER] New project initializing: ${data.name}`);
  });

  // Add a command to view logs
  program
    .command('logs:view')
    .description('View system logs (mock)')
    .action(() => {
      console.log('Displaying recent logs...');
      console.log('2026-02-03 15:45:01: Swarm started');
      console.log('2026-02-03 15:45:10: @CTO completed architecture review');
    });
}

export default { name, version, description, author, activate };
