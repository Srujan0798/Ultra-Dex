/**
 * Slack Integration Types
 */

export interface SlackConfig {
  /** Slack Bot OAuth token */
  botToken: string;
  /** Slack Signing Secret for verification */
  signingSecret: string;
  /** Socket Mode enabled (default: true for local dev) */
  socketMode?: boolean;
  /** App-level token for Socket Mode */
  appToken?: string;
  /** Default channel for notifications */
  defaultChannel?: string;
  /** Webhook URL for simple notifications */
  webhookUrl?: string;
  /** Notification levels to send */
  notificationLevels?: NotificationLevel[];
  /** Include workflow logs in notifications */
  includeLogs?: boolean;
}

export type NotificationLevel = 'all' | 'errors' | 'completions' | 'none';

export interface WorkflowNotification {
  type: 'workflow.started' | 'workflow.completed' | 'workflow.failed' | 'task.completed' | 'task.failed';
  workflowId: string;
  workflowName?: string;
  timestamp: string;
  data: {
    status?: 'success' | 'failed' | 'cancelled';
    durationMs?: number;
    totalCost?: number;
    nodeCount?: number;
    completedNodes?: number;
    failedNodes?: number;
    error?: string;
    logs?: string[];
  };
}

export interface CommandContext {
  userId: string;
  userName: string;
  channelId: string;
  teamId: string;
  responseUrl: string;
  triggerId: string;
}

export interface WorkflowTriggerConfig {
  workflowId: string;
  channelId: string;
  triggerOn: ('mention' | 'reaction' | 'scheduled')[];
  schedule?: string; // cron expression
  variables?: Record<string, string>;
}
