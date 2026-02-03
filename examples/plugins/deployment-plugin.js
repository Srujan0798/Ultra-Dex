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
