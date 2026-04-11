// Copyright (c) 2026 Ultra-Dex
/**
 * Notification Service
 * Multi-channel notifications (email, push, in-app, webhooks)
 *
 * @module services/notifications/notification-service
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';

/**
 * Notification channel
 */
export type NotificationChannel = 'email' | 'push' | 'in-app' | 'sms' | 'webhook' | 'slack';

/**
 * Notification priority
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Notification status
 */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms: boolean;
  };
  types: Record<
    string,
    {
      enabled: boolean;
      channels: NotificationChannel[];
      quietHours?: { start: string; end: string };
    }
  >;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  html?: string;
  channels: NotificationChannel[];
  variables: string[];
}

/**
 * Notification Service
 */
export class NotificationService {
  private initialized: boolean = false;
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    // Initialize default templates
    this.initializeDefaultTemplates();

    console.log('✓ Notification service initialized');
    this.initialized = true;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'template-approval-requested',
        name: 'Approval Requested',
        type: 'approval.requested',
        subject: 'Approval Required: {{title}}',
        body: 'You have a pending approval request for {{title}}. Please review and approve.',
        channels: ['email', 'in-app', 'push'],
        variables: ['title', 'requestor', 'description'],
      },
      {
        id: 'template-project-deployed',
        name: 'Project Deployed',
        type: 'project.deployed',
        subject: 'Project {{projectName}} Deployed Successfully',
        body: 'Your project {{projectName}} has been deployed to {{environment}}.',
        channels: ['email', 'in-app', 'slack'],
        variables: ['projectName', 'environment', 'version'],
      },
      {
        id: 'template-security-alert',
        name: 'Security Alert',
        type: 'security.alert',
        subject: 'Security Alert: {{alertType}}',
        body: 'A security alert has been triggered: {{alertType}}. Please review immediately.',
        channels: ['email', 'push', 'sms'],
        variables: ['alertType', 'severity', 'details'],
      },
      {
        id: 'template-team-invite',
        name: 'Team Invitation',
        type: 'team.invite',
        subject: "You've been invited to join {{teamName}}",
        body: '{{inviterName}} has invited you to join the team {{teamName}}.',
        channels: ['email', 'in-app'],
        variables: ['teamName', 'inviterName', 'role'],
      },
      {
        id: 'template-ai-task-complete',
        name: 'AI Task Complete',
        type: 'ai.task.complete',
        subject: 'AI Task Completed: {{taskName}}',
        body: 'Your AI task "{{taskName}}" has been completed successfully.',
        channels: ['email', 'in-app', 'push'],
        variables: ['taskName', 'duration', 'result'],
      },
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Send notification
   */
  async send(
    userId: string,
    type: string,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      data?: Record<string, any>;
      organizationId?: string;
    }
  ): Promise<Notification> {
    await this.initialize();

    const notification: Notification = {
      id: uuidv4(),
      userId,
      organizationId: options?.organizationId,
      type,
      title,
      message,
      priority: options?.priority || 'medium',
      channels: options?.channels || ['in-app'],
      data: options?.data,
      status: 'pending',
      createdAt: new Date(),
    };

    // Get user preferences
    const prefs = await this.getUserPreferences(userId);

    // Filter channels based on preferences
    const allowedChannels = notification.channels.filter((channel) => {
      const typeConfig = prefs.types[type];
      if (typeConfig) {
        return typeConfig.enabled && typeConfig.channels.includes(channel);
      }
      return prefs.channels[this.mapChannelToPref(channel)];
    });

    // Send to each channel
    for (const channel of allowedChannels) {
      try {
        await this.sendToChannel(notification, channel);
      } catch (error) {
        console.error(`Failed to send notification to ${channel}:`, error);
      }
    }

    notification.status = 'sent';
    notification.sentAt = new Date();

    // Store notification
    await ppmManager.add({
      content: `Notification sent: ${title}`,
      type: 'notification-sent',
      importance: notification.priority === 'critical' ? 8 : 4,
      metadata: {
        notificationId: notification.id,
        userId,
        type,
        channels: allowedChannels,
      },
    });

    return notification;
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    options?: {
      priority?: NotificationPriority;
      organizationId?: string;
    }
  ): Promise<Notification> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in template
    let title = template.subject;
    let message = template.body;

    for (const [key, value] of Object.entries(variables)) {
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.send(userId, template.type, title, message, {
      priority: options?.priority,
      channels: template.channels,
      organizationId: options?.organizationId,
    });
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'push':
        await this.sendPush(notification);
        break;
      case 'in-app':
        await this.sendInApp(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
      case 'slack':
        await this.sendSlack(notification);
        break;
      case 'webhook':
        await this.sendWebhook(notification);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // In real implementation, integrate with email service
    console.log(`[EMAIL] To: ${notification.userId}, Subject: ${notification.title}`);
  }

  /**
   * Send push notification
   */
  private async sendPush(notification: Notification): Promise<void> {
    // In real implementation, integrate with push service
    console.log(`[PUSH] To: ${notification.userId}, Title: ${notification.title}`);
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // Store for in-app retrieval
    await ppmManager.add({
      content: notification.message,
      type: 'in-app-notification',
      importance: notification.priority === 'critical' ? 8 : 4,
      metadata: {
        notificationId: notification.id,
        userId: notification.userId,
        title: notification.title,
      },
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<void> {
    // In real implementation, integrate with SMS service
    console.log(`[SMS] To: ${notification.userId}, Message: ${notification.message}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(notification: Notification): Promise<void> {
    // In real implementation, integrate with Slack
    console.log(`[SLACK] To: ${notification.userId}, Message: ${notification.message}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    // In real implementation, call user webhook
    console.log(`[WEBHOOK] To: ${notification.userId}, Event: ${notification.type}`);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    await this.initialize();

    let prefs = this.preferences.get(userId);
    if (!prefs) {
      // Create default preferences
      prefs = {
        userId,
        channels: {
          email: true,
          push: true,
          inApp: true,
          sms: false,
        },
        types: {
          'security.alert': {
            enabled: true,
            channels: ['email', 'push', 'sms'],
          },
          'approval.requested': {
            enabled: true,
            channels: ['email', 'in-app', 'push'],
          },
        },
      };
      this.preferences.set(userId, prefs);
    }

    return prefs;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    await this.initialize();

    const prefs = await this.getUserPreferences(userId);
    Object.assign(prefs, updates);

    await ppmManager.add({
      content: 'Notification preferences updated',
      type: 'preferences-updated',
      importance: 3,
      metadata: { userId },
    });

    return prefs;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: {
      status?: NotificationStatus;
      limit?: number;
      unreadOnly?: boolean;
    }
  ): Promise<Notification[]> {
    await this.initialize();

    const results = await ppmManager.search(`notification:${userId}`);
    let notifications: Notification[] = [];

    for (const result of results || []) {
      if (result.metadata?.notification) {
        notifications.push(result.metadata.notification as Notification);
      }
    }

    // Filter by status
    if (options?.status) {
      notifications = notifications.filter((n) => n.status === options.status);
    }

    // Filter unread
    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.readAt);
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Limit
    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    await this.initialize();

    // In real implementation, update in database
    console.log(`✓ Notification ${notificationId} marked as read`);
    return true;
  }

  /**
   * Map channel to preference key
   */
  private mapChannelToPref(
    channel: NotificationChannel
  ): keyof NotificationPreferences['channels'] {
    const mapping: Record<NotificationChannel, keyof NotificationPreferences['channels']> = {
      email: 'email',
      push: 'push',
      'in-app': 'inApp',
      sms: 'sms',
      webhook: 'email',
      slack: 'email',
    };
    return mapping[channel];
  }

  /**
   * Get notification statistics
   */
  async getStatistics(): Promise<{
    totalSent: number;
    byChannel: Record<NotificationChannel, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    await this.initialize();

    // In real implementation, query from database
    return {
      totalSent: 0,
      byChannel: { email: 0, push: 0, 'in-app': 0, sms: 0, webhook: 0, slack: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
