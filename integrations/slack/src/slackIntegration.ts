/**
 * Main Slack Integration Class
 * 
 * Manages Bolt app instance and coordinates between
 * Ultra-Dex events and Slack interactions.
 */

import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { SlackConfig, WorkflowNotification, CommandContext } from './types.js';
import { SlackNotifier } from './notifier.js';
import { SlackCommandHandler } from './commands.js';

export class SlackIntegration {
  private app?: App;
  private client?: WebClient;
  private notifier: SlackNotifier;
  private commandHandler: SlackCommandHandler;
  private config: SlackConfig;
  private eventHandlers: ((notification: WorkflowNotification) => void)[] = [];

  constructor(config: SlackConfig) {
    this.config = {
      socketMode: true,
      notificationLevels: ['all'],
      includeLogs: false,
      ...config,
    };

    this.notifier = new SlackNotifier(config);
    this.commandHandler = new SlackCommandHandler();
  }

  /**
   * Initialize the Slack app and start listening for events
   */
  async initialize(): Promise<void> {
    // Initialize web client for simple notifications
    this.client = new WebClient(this.config.botToken);

    // Initialize Bolt app for interactive features
    this.app = new App({
      token: this.config.botToken,
      signingSecret: this.config.signingSecret,
      socketMode: this.config.socketMode,
      appToken: this.config.appToken,
      logLevel: LogLevel.INFO,
    });

    this.registerEventHandlers();
    this.registerCommands();
    this.registerActions();

    // Start the app
    await this.app.start();
    console.log('⚡️ Slack integration running');
  }

  /**
   * Stop the Slack app
   */
  async stop(): Promise<void> {
    if (this.app) {
      await this.app.stop();
    }
  }

  /**
   * Send a workflow notification to Slack
   */
  async notify(notification: WorkflowNotification): Promise<void> {
    // Check if we should send this notification level
    if (!this.shouldNotify(notification.type)) {
      return;
    }

    await this.notifier.send(notification, this.client!);

    // Notify local handlers
    for (const handler of this.eventHandlers) {
      handler(notification);
    }
  }

  /**
   * Subscribe to notification events
   */
  onNotification(handler: (notification: WorkflowNotification) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  private shouldNotify(type: WorkflowNotification['type']): boolean {
    const levels = this.config.notificationLevels || ['all'];
    
    if (levels.includes('none')) return false;
    if (levels.includes('all')) return true;
    if (levels.includes('errors') && type.includes('failed')) return true;
    if (levels.includes('completions') && type.includes('completed')) return true;
    
    return false;
  }

  private registerEventHandlers(): void {
    // Handle app home opened
    this.app!.event('app_home_opened', async ({ event, client }) => {
      await client.views.publish({
        user_id: event.user,
        view: this.getHomeView(),
      });
    });

    // Handle mentions
    this.app!.event('app_mention', async ({ event, say }) => {
      await say({
        text: `Hello <@${event.user}>! 👋\nUse \`/ultradex help\` to see available commands.`,
        thread_ts: event.thread_ts,
      });
    });
  }

  private registerCommands(): void {
    // /ultradex command
    this.app!.command('/ultradex', async ({ command, ack, respond }) => {
      await ack();

      const context: CommandContext = {
        userId: command.user_id,
        userName: command.user_name,
        channelId: command.channel_id,
        teamId: command.team_id,
        responseUrl: command.response_url,
        triggerId: command.trigger_id,
      };

      const result = await this.commandHandler.handle(command.text, context);
      await respond(result);
    });
  }

  private registerActions(): void {
    // Handle workflow run button
    this.app!.action('run_workflow', async ({ ack, body, client }) => {
      await ack();
      
      // Extract workflow ID from action value
      const workflowId = (body as any).actions[0].value;
      
      await client.chat.postMessage({
        channel: (body as any).channel.id,
        text: `🚀 Starting workflow: ${workflowId}`,
      });

      // TODO: Trigger actual workflow execution
    });

    // Handle view submission
    this.app!.view('workflow_trigger_modal', async ({ ack, body, view }) => {
      await ack();
      
      const values = view.state.values;
      // Process form submission
      console.log('Workflow trigger values:', values);
    });
  }

  private getHomeView() {
    return {
      type: 'home' as const,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🤖 Ultra-Dex Workflow Studio',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Manage and monitor your AI workflows directly from Slack.',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Quick Actions*',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📋 List Workflows',
                emoji: true,
              },
              action_id: 'list_workflows',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '➕ New Workflow',
                emoji: true,
              },
              action_id: 'create_workflow',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 Dashboard',
                emoji: true,
              },
              url: 'http://localhost:3000',
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Commands*\n• `/ultradex run <workflow>` - Run a workflow\n• `/ultradex status <workflow>` - Check workflow status\n• `/ultradex logs <workflow>` - View recent logs\n• `/ultradex list` - List all workflows',
          },
        },
      ],
    };
  }
}
