/**
 * ultra-dex ci-monitor command
 * Self-healing CI/CD pipeline monitor (The Autonomic Nervous System)
 */

import chalk from 'chalk';
import http from 'http';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { buildGraph } from '../utils/graph.js';

export function registerCiMonitorCommand(program) {
  program
    .command('ci-monitor')
    .description('Start the Self-Healing CI/CD Webhook Listener')
    .option('-p, --port <port>', 'Webhook port', '3003')
    .option('--provider <provider>', 'AI provider for fixes')
    .action(async (options) => {
      const port = parseInt(options.port);
      console.log(chalk.cyan('\n🛡️  Ultra-Dex Self-Healing CI Monitor\n'));
      console.log(chalk.gray(`Listening for GitHub Webhooks on port ${port}...`));

      const server = http.createServer(async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              
              // Filter for Workflow Failures
              // (Simplification: Assuming GitHub Actions payload structure)
              if (payload.action === 'completed' && payload.workflow_job?.conclusion === 'failure') {
                await handleBuildFailure(payload, options);
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

async function handleBuildFailure(payload, options) {
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
    const fixPlan = await runAgentLoop('debugger', `Analyze this build failure and propose a fix:\n${logs}`, provider, context);
    
    // 3. Apply Fix (Mock - would be git push)
    console.log(chalk.bold('\nProposed Fix:'));
    console.log(chalk.gray(fixPlan));
    
    // In a real system, we would:
    // await runAgentLoop('devops', `Apply this fix and push to branch 'fix/${jobName}':\n${fixPlan}`, provider, context);
}
