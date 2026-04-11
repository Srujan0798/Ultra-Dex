/**
 * @fileoverview Deployment Plugin module
 * @module plugins/deployment-plugin
 */

// examples/plugins/deployment-plugin.js
export const name = 'deployment-plugin';
export const version = '1.0.0';
export const description = 'One-click deployment to custom VPS';

export async function activate(context) {
  const { program } = context;

  program
    .command('vps:deploy')
    .description('Deploy project to VPS via SSH')
    .option('--host <host>', 'VPS IP address')
    .action((options) => {
      if (!options.host) {
        console.log('Error: VPS host IP required.');
        return;
      }
      console.log(`Deploying to ${options.host}...`);
      console.log('1. Packing build artifacts...');
      console.log('2. Syncing files via rsync...');
      console.log('3. Restarting systemd services...');
      console.log('✅ Deployment successful!');
    });
}

export default { name, version, description, activate };

/**
 * Error handler for deployment-plugin
 * @param {Error} error - Error to handle
 */
function handleDeploymentpluginError(error) {
  try {
    console.error('[deployment-plugin]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
