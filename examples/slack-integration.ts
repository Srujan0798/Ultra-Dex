/**
 * Slack Integration Example
 * 
 * Shows how to integrate Slack notifications with workflow execution.
 */

import { SlackIntegration } from '../integrations/slack/src/index.js';
import { ExecutionEngine } from '../runtime/execution_engine/index.js';
import { MockAdapter } from '../adapters/mockAdapter.js';

async function main() {
  // Initialize Slack integration
  const slack = new SlackIntegration({
    botToken: process.env.SLACK_BOT_TOKEN || 'xoxb-your-token',
    signingSecret: process.env.SLACK_SIGNING_SECRET || 'your-signing-secret',
    appToken: process.env.SLACK_APP_TOKEN, // For Socket Mode
    socketMode: true,
    defaultChannel: '#workflows',
    notificationLevels: ['all'],
    includeLogs: true,
  });

  await slack.initialize();
  console.log('✅ Slack integration ready');

  // Create execution engine
  const adapter = new MockAdapter();
  const engine = new ExecutionEngine(adapter);

  // Forward events to Slack
  engine.events.on('workflow.started', (event) => {
    slack.notify({
      type: 'workflow.started',
      workflowId: event.workflowId,
      workflowName: event.workflowName,
      timestamp: new Date().toISOString(),
      data: {
        nodeCount: event.totalNodes,
      },
    });
  });

  engine.events.on('workflow.completed', (event) => {
    slack.notify({
      type: 'workflow.completed',
      workflowId: event.workflowId,
      workflowName: event.workflowName,
      timestamp: event.timestamp,
      data: {
        status: event.status,
        durationMs: event.durationMs,
        totalCost: event.totalCost,
        completedNodes: event.completedNodes,
        failedNodes: event.failedNodes,
      },
    });
  });

  engine.events.on('workflow.failed', (event) => {
    slack.notify({
      type: 'workflow.failed',
      workflowId: event.workflowId,
      workflowName: event.workflowName,
      timestamp: event.timestamp,
      data: {
        status: 'failed',
        error: event.error?.message || 'Unknown error',
        durationMs: event.durationMs,
      },
    });
  });

  // Listen for Slack commands
  slack.onNotification((notification) => {
    console.log('Slack notification sent:', notification.type);
  });

  console.log('🔗 Event forwarding configured');
  console.log('Try running: /ultradex run <workflow-name> in Slack');

  // Keep running
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await slack.stop();
    process.exit(0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
