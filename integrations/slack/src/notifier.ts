/**
 * Slack Notifier
 * 
 * Formats and sends workflow notifications to Slack channels.
 */

import { WebClient } from '@slack/web-api';
import { WorkflowNotification, SlackConfig } from './types.js';

export class SlackNotifier {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  async send(notification: WorkflowNotification, client: WebClient): Promise<void> {
    const channel = this.config.defaultChannel;
    if (!channel) {
      console.warn('No default Slack channel configured');
      return;
    }

    const blocks = this.formatNotification(notification);
    const text = this.formatPlainText(notification);

    try {
      await client.chat.postMessage({
        channel,
        text,
        blocks,
        unfurl_links: false,
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private formatNotification(notification: WorkflowNotification): unknown[] {
    const { type, workflowId, workflowName, data } = notification;
    const name = workflowName || workflowId;

    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: this.getHeaderText(type, name),
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Workflow:*\n${name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${this.getStatusEmoji(data.status)} ${data.status || 'running'}`,
          },
        ],
      },
    ];

    // Add duration if available
    if (data.durationMs) {
      (blocks[1] as any).fields.push({
        type: 'mrkdwn',
        text: `*Duration:*\n${this.formatDuration(data.durationMs)}`,
      });
    }

    // Add cost if available
    if (data.totalCost !== undefined) {
      (blocks[1] as any).fields.push({
        type: 'mrkdwn',
        text: `*Cost:*\n$${data.totalCost.toFixed(4)}`,
      });
    }

    // Add progress for running workflows
    if (data.nodeCount && data.completedNodes !== undefined) {
      const percentage = Math.round((data.completedNodes / data.nodeCount) * 100);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Progress:* ${data.completedNodes}/${data.nodeCount} nodes (${percentage}%)`,
        },
      });
    }

    // Add error details if failed
    if (data.error) {
      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error:*\n\`\`\`${data.error.substring(0, 2900)}\`\`\``, // Slack has 3000 char limit
          },
        }
      );
    }

    // Add action buttons for completed/failed workflows
    if (type === 'workflow.completed' || type === 'workflow.failed') {
      blocks.push(
        { type: 'divider' },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🔄 Re-run',
                emoji: true,
              },
              value: workflowId,
              action_id: 'run_workflow',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View Details',
                emoji: true,
              },
              url: `http://localhost:3000/workflows/${workflowId}`,
            },
          ],
        }
      );
    }

    return blocks;
  }

  private formatPlainText(notification: WorkflowNotification): string {
    const { type, workflowName, data } = notification;
    const name = workflowName || notification.workflowId;
    
    let text = this.getHeaderText(type, name);
    
    if (data.status) {
      text += ` | Status: ${data.status}`;
    }
    if (data.durationMs) {
      text += ` | Duration: ${this.formatDuration(data.durationMs)}`;
    }
    if (data.error) {
      text += ` | Error: ${data.error.substring(0, 100)}`;
    }
    
    return text;
  }

  private getHeaderText(type: WorkflowNotification['type'], name: string): string {
    switch (type) {
      case 'workflow.started':
        return `🚀 Workflow Started: ${name}`;
      case 'workflow.completed':
        return `✅ Workflow Completed: ${name}`;
      case 'workflow.failed':
        return `❌ Workflow Failed: ${name}`;
      case 'task.completed':
        return `✓ Task Completed: ${name}`;
      case 'task.failed':
        return `✗ Task Failed: ${name}`;
      default:
        return `Workflow Update: ${name}`;
    }
  }

  private getStatusEmoji(status?: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⛔';
      default:
        return '⏳';
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}
