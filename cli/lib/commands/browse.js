// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Browse module
 * @module commands/browse
 */

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
        const allowlist = options.allow ? options.allow.split(',').map((s) => s.trim()) : [];
        const blocklist = options.block ? options.block.split(',').map((s) => s.trim()) : [];
        const agent = new BrowserAgent({ allowlist, blocklist });

        const resolveUrl = () => {
          if (options.url) return options.url;
          if (!task) return null;
          const match = task.match(/https?:\/\/[^\s]+/i);
          return match ? match[0] : null;
        };

        const buildScriptFromTask = (intent, url) => {
          const script = [];
          if (url) script.push({ action: 'goto', value: url });
          if (intent === 'screenshot') {
            script.push({ action: 'wait', value: 1000 });
            script.push({ action: 'screenshot' });
          }
          if (intent === 'analyze') {
            script.push({ action: 'wait', value: 1000 });
            script.push({ action: 'screenshot' });
            script.push({ action: 'dom' });
          }
          return script;
        };

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
          const url = resolveUrl();
          const lower = task.toLowerCase();
          const intent = lower.includes('analyze')
            ? 'analyze'
            : lower.includes('screenshot') || lower.includes('snap')
              ? 'screenshot'
              : 'browse';

          if (!url) {
            throw new Error('No URL detected in task. Provide --url or include a URL in the task.');
          }

          if (intent === 'analyze') {
            const result = await agent.analyzePage(url, options);
            printSuccess(chalk.green(`\n✅ Analysis complete. Screenshot: ${result.screenshot}\n`));
            if (result.analysis) {
              printInfo(chalk.gray(JSON.stringify(result.analysis, null, 2)));
            }
            return;
          }

          const script = buildScriptFromTask(intent, url);
          const results = await agent.runScript(script, options);
          const lastShot = results.find((s) => s.action === 'screenshot')?.result?.screenshot;
          if (lastShot) {
            printSuccess(chalk.green(`\n✅ Screenshot saved: ${lastShot}\n`));
          } else {
            printSuccess(chalk.green(`\n✅ Task completed for ${url}\n`));
          }
        }

        if (options.record) {
          const url = resolveUrl() || 'https://example.com';
          const steps = buildScriptFromTask('screenshot', url);
          await agent.recordSession(steps, options.record);
          printSuccess(chalk.green(`\n✅ Recorded session to ${options.record}\n`));
        } else {
          printWarning(
            chalk.yellow('No actions performed. Use --record, --replay, or --screenshot.')
          );
        }
      } catch (error) {
        printError(chalk.red(`Browse failed: ${error.message}`));
      }
    });
}
