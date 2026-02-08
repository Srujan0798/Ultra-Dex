import fs from 'fs/promises';
import path from 'path';

export default {
  async activate(manager) {
    const logFile = path.join(process.cwd(), '.ultra/activity.log');

    manager.registerHook('pre-run', async (context) => {
      const entry = `[${new Date().toISOString()}] START: ${context.task} (Agent: ${context.agent})\n`;
      await fs.appendFile(logFile, entry);
    });

    manager.registerHook('post-run', async (context) => {
      const entry = `[${new Date().toISOString()}] FINISH: ${context.task} (Status: ${context.status})\n`;
      await fs.appendFile(logFile, entry);
    });
  },
};
