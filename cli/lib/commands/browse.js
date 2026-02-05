import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { BrowserAgent } from '../browser/agent.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerBrowseCommand(program) {
  program
    .command('browse [task]')
    .description('Browser automation agent with vision')
    .option('--record <path>', 'Record session to file')
    .option('--replay <path>', 'Replay recorded session')
    .option('--screenshot', 'Take a screenshot of the target URL')
    .option('--url <url>', 'Target URL')
    .option('--allow <hosts>', 'Comma-separated allowlist hosts')
    .option('--block <hosts>', 'Comma-separated blocklist hosts')
    .action(async (task, options) => {
      try {
        const allowlist = options.allow ? options.allow.split(',').map(s => s.trim()) : [];
        const blocklist = options.block ? options.block.split(',').map(s => s.trim()) : [];
        const agent = new BrowserAgent({ allowlist, blocklist });

        if (options.replay) {
          const result = await agent.replaySession(options.replay, options);
          printSuccess(chalk.green(`\n✅ Replayed session with ${result.length} steps\n`));
          return;
        }

        if (options.screenshot) {
          if (!options.url) throw new Error('Provide --url for screenshot');
          const shot = await agent.quickScreenshot(options.url, options);
          printSuccess(chalk.green(`\n✅ Screenshot saved: ${shot}\n`));
          return;
        }

        if (task) {
          printInfo(chalk.cyan('\nBrowser automation (placeholder)'));
          printInfo(chalk.gray(`Task: ${task}`));
        }

        if (options.record) {
          const steps = [{ action: 'goto', value: options.url || 'https://example.com' }];
          await agent.recordSession(steps, options.record);
          printSuccess(chalk.green(`\n✅ Recorded session to ${options.record}\n`));
        } else {
          printWarning(chalk.yellow('No actions performed. Use --record, --replay, or --screenshot.'));
        }
      } catch (error) {
        printError(chalk.red(`Browse failed: ${error.message}`));
      }
    });
}

