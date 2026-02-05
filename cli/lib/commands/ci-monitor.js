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
import { projectGraph } from '../mcp/graph.js';
import { dashboardNotifier } from '../utils/dashboard-notifier.js';
import { CiHealer } from '../ci/healer.js';

export function registerCiMonitorCommand(program) {
  program
    .command('ci-monitor')
    .description('Start the Self-Healing CI/CD Webhook Listener')
    .option('-p, --port <port>', 'Webhook port', '3003')
    .option('--provider <provider>', 'AI provider for fixes')
    .option('--slack-webhook <url>', 'Slack webhook URL for notifications')
    .option('--discord-webhook <url>', 'Discord webhook URL for notifications')
    .option('--notify-on <events>', 'Comma-separated events: failure,success,fix (default: failure)', 'failure')
    .option('--dashboard', 'Notify Ultra-Dex Dashboard of CI events')
    .option('--heal', 'Enable automatic healing loop')
    .option('--max-attempts <n>', 'Max healing attempts', '3')
    .action(async (options) => {
      const port = parseInt(options.port);
      const notifyEvents = options.notifyOn.split(',').map(e => e.trim());

      console.log(chalk.cyan('\n🛡️  Ultra-Dex Self-Healing CI Monitor\n'));
      console.log(chalk.gray(`Listening for GitHub Webhooks on port \${port}...`));

      const server = http.createServer(async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              const event = req.headers['x-github-event'];

              if (event === 'workflow_job' && payload.action === 'completed') {
                if (payload.workflow_job.conclusion === 'failure') {
                  // 1. Return 200 response immediately to prevent webhook timeout
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'accepted', message: 'Processing build failure...' }));

                  // 2. Process handleBuildFailure asynchronously (fire & forget)
                  handleBuildFailure(payload, options, notifyEvents).catch(err => {
                    console.error('Background task failed:', err);
                  });
                  return;
                } else if (payload.workflow_job.conclusion === 'success' && notifyEvents.includes('success')) {
                  // Return 200 immediately, then process notification asynchronously
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'received', message: 'Build successful' }));
                  
                  // Process notification in background (fire & forget)
                  notifySuccess(payload, options).catch(err => {
                    console.error('Background notification failed:', err);
                  });
                  return;
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
      });
    });
}

async function fetchGithubLogs(repo, jobId) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return "GITHUB_TOKEN not set. Cannot fetch real logs.";

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${repo}/actions/jobs/${jobId}/logs`,
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'Ultra-Dex-CI-Monitor',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.get(options, (res) => {
            if (res.statusCode === 302) {
                // Handle redirect to log URL
                https.get(res.headers.location, (logRes) => {
                    let logData = '';
                    logRes.on('data', chunk => logData += chunk);
                    logRes.on('end', () => resolve(logData.substring(0, 5000))); // Cap at 5k chars
                });
            } else {
                resolve(`Failed to fetch logs (Status ${res.statusCode})`);
            }
        });
        req.on('error', () => resolve("Error fetching logs from GitHub API."));
    });
}

async function handleBuildFailure(payload, options, notifyEvents) {
  const job = payload.workflow_job;
  const repo = payload.repository.full_name;
  
  if (options.dashboard) {
      await dashboardNotifier.sendLog(`🚨 CI Build Failed: ${job.name} (${repo})`, 'error');
  }

  const logs = await fetchGithubLogs(repo, job.id);
  const healer = new CiHealer({ maxAttempts: parseInt(options.maxAttempts, 10) || 3 });
  const analysis = healer.analyze(logs);
  console.log(chalk.red(`\n🚨 Build Failed: ${job.name} in ${repo}`));
  console.log(chalk.yellow('   Initiating Self-Healing Protocol...'));

  const providerId = options.provider || getDefaultProvider() || 'router';
  const provider = createProvider(providerId);

  // 1. Context Analysis
  await projectGraph.scan();
  const context = {
    context: `Build Failure Log:\n${logs}\n\nJob: ${job.name}\nRepo: ${repo}`,
    graph: projectGraph.getSummary()
  };

  // 2. Fix Generation
  const fixPrompt = `Analyze build failure and fix code using WRITE_CODE.\nFailure type: ${analysis.type}\nSuggested strategy: ${analysis.suggestion}\nLogs:\n${logs}`;
  const fixPlan = await runAgentLoop('debugger', fixPrompt, provider, context);
    
  // 3. Apply & Push
  if (options.heal) {
    await runAgentLoop('devops', `Commit the fix to a new branch 'fix/${job.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}' and push.`, provider, context);
  }

  // 4. Notifications
  const notification = {
    title: `🚨 Build Failed: ${job.name}`,
    repo, branch: job.head_branch,
    commit: job.head_sha?.substring(0, 7),
    url: job.html_url,
    error: logs.substring(0, 500),
    fix: fixPlan.substring(0, 300),
    strategy: analysis.suggestion
  };

  if (options.slackWebhook) await sendSlackNotification(options.slackWebhook, notification, 'failure');
  if (options.discordWebhook) await sendDiscordNotification(options.discordWebhook, notification, 'failure');
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
