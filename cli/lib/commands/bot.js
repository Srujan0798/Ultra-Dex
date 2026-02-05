import chalk from 'chalk';
import http from 'http';
import { Command } from 'commander';
import { reviewGitHubPR, reviewGitLabMR } from '../bots/code-review/index.js';
import { configManager } from '../utils/config-manager.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerBotCommand(program) {
  const bot = new Command('bot');
  bot.description('Code review bot for GitHub/GitLab');

  bot
    .command('setup <provider>')
    .description('Configure bot provider (github|gitlab)')
    .action(async (provider) => {
      const config = await configManager.loadGlobal() || {};
      if (provider === 'github') {
        config.github = { token: process.env.ULTRA_DEX_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '' };
      } else if (provider === 'gitlab') {
        config.gitlab = { token: process.env.ULTRA_DEX_GITLAB_TOKEN || process.env.GITLAB_TOKEN || '' };
      }
      await configManager.saveGlobal(config);
      printSuccess(chalk.green('\n✅ Bot configuration saved.\n'));
    });

  bot
    .command('start')
    .description('Start webhook listener')
    .option('--port <port>', 'Port', '4020')
    .action(async (options) => {
      const port = parseInt(options.port, 10) || 4020;
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      server.listen(port, () => {
        printSuccess(chalk.green(`\n✅ Bot webhook listening on port ${port}\n`));
      });
    });

  bot
    .command('review <prUrl>')
    .description('Review a GitHub/GitLab PR/MR')
    .action(async (prUrl) => {
      try {
        if (prUrl.includes('github.com')) {
          const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
          if (!match) throw new Error('Invalid GitHub PR URL');
          const [_, owner, repo, prNumber] = match;
          const config = await configManager.loadGlobal();
          const token = config?.github?.token || process.env.GITHUB_TOKEN;
          if (!token) throw new Error('GitHub token missing');
          const report = await reviewGitHubPR({ owner, repo, prNumber, token });
          printInfo(report.report);
          return;
        }

        if (prUrl.includes('gitlab.com')) {
          const match = prUrl.match(/gitlab\.com\/(.+?)\/-\/merge_requests\/(\d+)/);
          if (!match) throw new Error('Invalid GitLab MR URL');
          const [_, projectId, mrIid] = match;
          const config = await configManager.loadGlobal();
          const token = config?.gitlab?.token || process.env.GITLAB_TOKEN;
          if (!token) throw new Error('GitLab token missing');
          const report = await reviewGitLabMR({ projectId, mrIid, token });
          printInfo(report.report);
          return;
        }

        throw new Error('Unsupported PR URL');
      } catch (error) {
        printError(chalk.red(`Review failed: ${error.message}`));
      }
    });

  program.addCommand(bot);
}

