/**
 * Ultra-Dex Slack Integration
 * 
 * Features:
 * - Real-time workflow notifications to Slack channels
 * - Slash commands for workflow management
 * - Interactive buttons for workflow control
 * - Event subscriptions for workflow state changes
 */

export { SlackIntegration } from './slackIntegration.js';
export { SlackNotifier } from './notifier.js';
export { SlackCommandHandler } from './commands.js';
export type {
  SlackConfig,
  NotificationLevel,
  WorkflowNotification,
  CommandContext
} from './types.js';
