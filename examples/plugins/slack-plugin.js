// examples/plugins/slack-plugin.js
export const name = 'slack-plugin';
export const version = '1.0.0';
export const description = 'Send build updates to Slack';
export const author = 'Ultra-Dex Team';

/**
 * Activation function
 * @param {Object} context - Plugin context
 */
export async function activate(context) {
  const { program } = context;

  program
    .command('slack:notify <message>')
    .description('Send a message to Slack channel')
    .action((message) => {
      console.log(`Slack Plugin: Sending message -> "${message}"`);
      // Mock API call
      setTimeout(() => {
        console.log('✅ Slack notification sent!');
      }, 500);
    });
}

export default { name, version, description, author, activate };

/**
 * Error handler for slack-plugin
 * @param {Error} error - Error to handle
 */
function handleSlackpluginError(error) {
  try {
    console.error('[slack-plugin]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
