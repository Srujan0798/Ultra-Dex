/**
 * @fileoverview Index module
 * @module slack/index
 */

export default {
  async activate(manager) {
    manager.registerHook('post-run', async (context) => {
      const webhook = process.env.SLACK_WEBHOOK_URL;
      if (!webhook) return;

      const message = {
        text: `🚀 *Ultra-Dex Update*\nTask: ${context.task}\nStatus: ${context.status}`,
      };

      try {
        await fetch(webhook, {
          method: 'POST',
          body: JSON.stringify(message),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.warn('Slack notification failed');
      }
    });
  },
};
