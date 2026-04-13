/**
 * Slack Command Handler
 * 
 * Processes slash commands from Slack users.
 */

import { CommandContext } from './types.js';

export class SlackCommandHandler {
  async handle(commandText: string, context: CommandContext): Promise<object> {
    const [subCommand, ...args] = commandText.trim().split(/\s+/);

    switch (subCommand.toLowerCase()) {
      case 'run':
        return this.handleRun(args, context);
      case 'status':
        return this.handleStatus(args, context);
      case 'logs':
        return this.handleLogs(args, context);
      case 'list':
        return this.handleList(context);
      case 'help':
      default:
        return this.handleHelp();
    }
  }

  private async handleRun(args: string[], context: CommandContext): Promise<object> {
    if (args.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'Please specify a workflow ID. Usage: `/ultradex run <workflow-id>`',
      };
    }

    const workflowId = args[0];
    
    return {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${context.userId}> is starting workflow *${workflowId}*`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Progress',
                emoji: true,
              },
              url: `http://localhost:3000/workflows/${workflowId}`,
            },
          ],
        },
      ],
    };
  }

  private async handleStatus(args: string[], context: CommandContext): Promise<object> {
    if (args.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'Please specify a workflow ID. Usage: `/ultradex status <workflow-id>`',
      };
    }

    const workflowId = args[0];

    // TODO: Query actual workflow status
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Workflow Status: ${workflowId}*\n\nStatus: ⏳ Running\nProgress: 3/5 nodes\nDuration: 2m 30s`,
          },
        },
      ],
    };
  }

  private async handleLogs(args: string[], context: CommandContext): Promise<object> {
    if (args.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'Please specify a workflow ID. Usage: `/ultradex logs <workflow-id>`',
      };
    }

    const workflowId = args[0];

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Recent logs for ${workflowId}*\n\n\`\`\`\n[2024-01-15 10:30:15] Workflow started\n[2024-01-15 10:30:16] Node 'extract_data' executing...\n[2024-01-15 10:30:18] Node 'extract_data' completed\n[2024-01-15 10:30:19] Node 'analyze' executing...\n\`\`\``,            
          },
        },
      ],
    };
  }

  private async handleList(context: CommandContext): Promise<object> {
    // TODO: Query actual workflow list
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Workflows*',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `data-pipeline` - Daily data processing\n• `content-generator` - AI content creation\n• `sentiment-analysis` - Customer feedback analysis',
          },
        },
      ],
    };
  }

  private handleHelp(): object {
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Ultra-Dex Bot Commands*',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/ultradex run <workflow>` - Run a workflow\n`/ultradex status <workflow>` - Check workflow status\n`/ultradex logs <workflow>` - View recent logs\n`/ultradex list` - List all workflows\n`/ultradex help` - Show this help message',
          },
        },
      ],
    };
  }
}
