/**
 * Slack Connector for Ultra-Dex
 * Send messages, get channel info, post notifications
 */

import { Connector, ConnectorAuth, ConnectorOperation } from './types.js';

export interface SlackConfig {
  token: string;
  signingSecret?: string;
  defaultChannel?: string;
}

export class SlackConnector implements Connector {
  id = 'slack';
  name = 'Slack';
  description = 'Send notifications and messages to Slack';
  category = 'communication' as const;
  status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  auth: ConnectorAuth;
  operations: ConnectorOperation[] = [
    {
      name: 'sendMessage',
      description: 'Send a message to a Slack channel',
      input: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['channel', 'text'],
      },
      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          channel: { type: 'string' },
          ts: { type: 'string' },
        },
      },
    },
    {
      name: 'postNotification',
      description: 'Post a formatted notification to Slack',
      input: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                value: { type: 'string' },
                short: { type: 'boolean' },
              },
            },
          },
          color: { type: 'string' },
        },
        required: ['channel', 'title', 'message'],
      },
      output: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          channel: { type: 'string' },
          ts: { type: 'string' },
        },
      },
    },
    {
      name: 'getChannelInfo',
      description: 'Get information about a Slack channel',
      input: {
        type: 'object',
        properties: {
          channelId: { type: 'string' },
        },
        required: ['channelId'],
      },
      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          isPrivate: { type: 'boolean' },
          numMembers: { type: 'number' },
          topic: { type: 'string' },
          purpose: { type: 'string' },
        },
      },
    },
  ];
  lastError?: string;

  private token: string;
  private signingSecret?: string;
  private defaultChannel?: string;

  constructor(config: SlackConfig) {
    this.token = config.token;
    this.signingSecret = config.signingSecret;
    this.defaultChannel = config.defaultChannel;
    this.auth = { type: 'token', token: config.token };
  }

  async connect(): Promise<void> {
    try {
      // Validate token by fetching auth info
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(
    channel: string,
    text: string
  ): Promise<{
    ok: boolean;
    channel: string;
    ts: string;
  }> {
    this.ensureConnected();

    const targetChannel = channel || this.defaultChannel;
    if (!targetChannel) {
      throw new Error('No channel specified and no default channel set');
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: targetChannel,
        text,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      ok: data.ok,
      channel: data.channel,
      ts: data.ts,
    };
  }

  /**
   * Post a notification (formatted message) to Slack
   */
  async postNotification(
    channel: string,
    title: string,
    message: string,
    fields?: Array<{ title: string; value: string; short?: boolean }>,
    color?: string
  ): Promise<{
    ok: boolean;
    channel: string;
    ts: string;
  }> {
    this.ensureConnected();

    const targetChannel = channel || this.defaultChannel;
    if (!targetChannel) {
      throw new Error('No channel specified and no default channel set');
    }

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    if (fields && fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map((field) => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      });
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: targetChannel,
        blocks,
        ...(color && { attachments: [{ color }] }),
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      ok: data.ok,
      channel: data.channel,
      ts: data.ts,
    };
  }

  /**
   * Get information about a Slack channel
   */
  async getChannelInfo(channelId: string): Promise<{
    id: string;
    name: string;
    isPrivate: boolean;
    numMembers: number;
    topic?: string;
    purpose?: string;
  }> {
    this.ensureConnected();

    const response = await fetch(`https://slack.com/api/conversations.info?channel=${channelId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    const channel = data.channel;
    return {
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      numMembers: channel.num_members,
      topic: channel.topic?.value,
      purpose: channel.purpose?.value,
    };
  }

  /**
   * Send a sales notification (specific to sales use case)
   */
  async sendSalesNotification(
    channel: string,
    dealTitle: string,
    amount: number,
    stage: string,
    closeDate: string,
    rep: string
  ): Promise<{
    ok: boolean;
    channel: string;
    ts: string;
  }> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    const fields = [
      { title: 'Amount', value: formattedAmount, short: true },
      { title: 'Stage', value: stage, short: true },
      { title: 'Close Date', value: closeDate, short: true },
      { title: 'Rep', value: rep, short: true },
    ];

    return this.postNotification(
      channel,
      `💰 Deal Update: ${dealTitle}`,
      `Notification about deal ${dealTitle}`,
      fields,
      '#36a64f' // Green color
    );
  }

  private ensureConnected(): void {
    if (this.status !== 'connected') {
      throw new Error('Slack connector not connected. Call connect() first.');
    }
  }
}

export default SlackConnector;
