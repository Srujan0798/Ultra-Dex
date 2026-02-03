/**
 * ultra-dex ci-monitor command
 * Self-healing CI/CD pipeline monitor with webhook notifications (The Autonomic Nervous System)
 */

import chalk from 'chalk';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { buildGraph } from '../utils/graph.js';

export function registerCiMonitorCommand(program) {
  program
    .command('ci-monitor')
    .description('Start the Self-Healing CI/CD Webhook Listener')
    .option('-p, --port <port>', 'Webhook port', '3003')
    .option('--provider <provider>', 'AI provider for fixes')
    .option('--slack-webhook <url>', 'Slack webhook URL for notifications')
    .option('--discord-webhook <url>', 'Discord webhook URL for notifications')
    .option('--notify-on <events>', 'Comma-separated events: failure,success,fix (default: failure)', 'failure')
    .action(async (options) => {
      const port = parseInt(options.port);
      const notifyEvents = options.notifyOn.split(',').map(e => e.trim());

      console.log(chalk.cyan('\n🛡️  Ultra-Dex Self-Healing CI Monitor\n'));
      console.log(chalk.gray(`Listening for GitHub Webhooks on port ${port}...`));

      if (options.slackWebhook) {
        console.log(chalk.green(`📱 Slack notifications: ${options.slackWebhook.substring(0, 30)}...`));
      }
      if (options.discordWebhook) {
        console.log(chalk.green(`💬 Discord notifications: ${options.discordWebhook.substring(0, 30)}...`));
      }
      if (!options.slackWebhook && !options.discordWebhook) {
        console.log(chalk.yellow('⚠️  No webhook configured. Use --slack-webhook or --discord-webhook'));
      }
      console.log();

      const server = http.createServer(async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);

              // Handle different webhook events
              if (payload.action === 'completed' && payload.workflow_job) {
                const { workflow_job, repository: _repository } = payload;

                if (workflow_job.conclusion === 'failure') {
                  await handleBuildFailure(payload, options, notifyEvents);
                } else if (workflow_job.conclusion === 'success' && notifyEvents.includes('success')) {
                  await notifySuccess(payload, options);
                }
              }

              res.writeHead(200);
              res.end('Received');
            } catch (e) {
              console.error(chalk.red('Webhook Error:'), e.message);
              res.writeHead(400);
              res.end('Bad Request');
            }
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(port, () => {
        console.log(chalk.green(`✅ Monitor Active: http://localhost:${port}`));
        console.log(chalk.gray(`   Send GitHub webhook events to this endpoint`));
        console.log(chalk.gray(`   Events: ${notifyEvents.join(', ')}\n`));
      });
    });
}

async function handleBuildFailure(payload, options, notifyEvents) {
  const jobName = payload.workflow_job.name;
  const repo = payload.repository.full_name;
  const logs = "Mock Log: Error: Cannot find module './utils/graph.js'"; // Real imp would fetch logs via API

  console.log(chalk.red(`\n🚨 Build Failed: ${jobName} in ${repo}`));
  console.log(chalk.yellow('   Initiating Self-Healing Protocol...'));

  const providerId = options.provider || getDefaultProvider() || 'router';
  const provider = createProvider(providerId);

  // 1. Analyze Context (CPG)
  const graph = await buildGraph();
  const context = {
    context: `Build Failure Log:\n${logs}\n\nRepository: ${repo}`,
    graph
  };

  // 2. Diagnose & Fix (@Debugger)
  const fixPlan = await runAgentLoop('debugger', `Analyze this build failure, fix the code using WRITE_CODE, and explain what you did:\n${logs}`, provider, context);
    
  // 3. Apply Fix
  console.log(chalk.bold('\nProposed Fix:'));
  console.log(chalk.gray(fixPlan));
    
  console.log(chalk.yellow('\n🚀 Applying Fix via @DevOps...'));
  await runAgentLoop('devops', `The fix has been applied to the code. Please create a new branch 'fix/${jobName.replace(/[^a-zA-Z0-9-_]/g, '-')}', commit the changes, and push using git commands.`, provider, context);

  // 4. Send Notifications
  if (notifyEvents.includes('failure')) {
    const notification = {
      title: `🚨 Build Failed: ${jobName}`,
      repo: repo,
      branch: payload.workflow_job.head_branch,
      commit: payload.workflow_job.head_sha?.substring(0, 7) || 'unknown',
      url: payload.workflow_job.html_url,
      error: logs.substring(0, 500),
      fix: fixPlan.substring(0, 300)
    };

    if (options.slackWebhook) {
      await sendSlackNotification(options.slackWebhook, notification, 'failure');
    }
    if (options.discordWebhook) {
      await sendDiscordNotification(options.discordWebhook, notification, 'failure');
    }
  }
}

async function notifySuccess(payload, options) {
  const notification = {
    title: `✅ Build Successful: ${payload.workflow_job.name}`,
    repo: payload.repository.full_name,
    branch: payload.workflow_job.head_branch,
    commit: payload.workflow_job.head_sha?.substring(0, 7) || 'unknown',
    url: payload.workflow_job.html_url,
    duration: payload.workflow_job.duration || 'unknown'
  };

  console.log(chalk.green(`\n✅ Build Success: ${notification.title}`));

  if (options.slackWebhook) {
    await sendSlackNotification(options.slackWebhook, notification, 'success');
  }
  if (options.discordWebhook) {
    await sendDiscordNotification(options.discordWebhook, notification, 'success');
  }
}

async function sendSlackNotification(webhookUrl, data, type) {
  try {
    const url = new URL(webhookUrl);

    let slackPayload = {};

    if (type === 'failure') {
      slackPayload = {
        text: `🚨 Ultra-Dex CI: Build Failed`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Repository', value: data.repo, short: true },
            { title: 'Job', value: data.title.replace('🚨 Build Failed: ', ''), short: true },
            { title: 'Branch', value: data.branch, short: true },
            { title: 'Commit', value: data.commit, short: true },
            { title: 'Error', value: '```' + data.error + '```', short: false },
            { title: 'Proposed Fix', value: '```' + data.fix + '```', short: false },
            { title: 'View Details', value: data.url, short: false }
          ]
        }]
      };
    } else {
      slackPayload = {
        text: `✅ Ultra-Dex CI: Build Successful`,
        attachments: [{
          color: 'good',
          fields: [
            { title: 'Repository', value: data.repo, short: true },
            { title: 'Branch', value: data.branch, short: true },
            { title: 'Commit', value: data.commit, short: true },
            { title: 'Duration', value: data.duration, short: true },
            { title: 'View Details', value: data.url, short: false }
          ]
        }]
      };
    }

    const postData = JSON.stringify(slackPayload);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(chalk.green('   📱 Slack notification sent'));
      } else {
        console.log(chalk.yellow(`   ⚠️ Slack notification failed: ${res.statusCode}`));
      }
    });

    req.on('error', (e) => {
      console.log(chalk.red(`   ❌ Slack webhook error: ${e.message}`));
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.log(chalk.red(`   ❌ Failed to send Slack notification: ${error.message}`));
  }
}

async function sendDiscordNotification(webhookUrl, data, type) {
  try {
    const url = new URL(webhookUrl);

    let discordPayload = {};

    if (type === 'failure') {
      discordPayload = {
        username: 'Ultra-Dex CI Monitor',
        avatar_url: 'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main/cli/assets/logo.png',
        embeds: [{
          title: '🚨 Build Failed',
          color: 0xff0000, // Red
          fields: [
            { name: 'Repository', value: data.repo, inline: true },
            { name: 'Job', value: data.title.replace('🚨 Build Failed: ', ''), inline: true },
            { name: 'Branch', value: data.branch, inline: true },
            { name: 'Commit', value: data.commit, inline: true },
            { name: 'Error', value: '```' + data.error.substring(0, 400) + '```' },
            { name: 'Proposed Fix', value: '```' + data.fix.substring(0, 250) + '```' },
            { name: 'Link', value: data.url }
          ],
          timestamp: new Date().toISOString()
        }]
      };
    } else {
      discordPayload = {
        username: 'Ultra-Dex CI Monitor',
        avatar_url: 'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main/cli/assets/logo.png',
        embeds: [{
          title: '✅ Build Successful',
          color: 0x00ff00, // Green
          fields: [
            { name: 'Repository', value: data.repo, inline: true },
            { name: 'Branch', value: data.branch, inline: true },
            { name: 'Commit', value: data.commit, inline: true },
            { name: 'Duration', value: data.duration, inline: true },
            { name: 'Link', value: data.url }
          ],
          timestamp: new Date().toISOString()
        }]
      };
    }

    const postData = JSON.stringify(discordPayload);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 204) {
        console.log(chalk.green('   💬 Discord notification sent'));
      } else {
        console.log(chalk.yellow(`   ⚠️ Discord notification failed: ${res.statusCode}`));
      }
    });

    req.on('error', (e) => {
      console.log(chalk.red(`   ❌ Discord webhook error: ${e.message}`));
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.log(chalk.red(`   ❌ Failed to send Discord notification: ${error.message}`));
  }
}