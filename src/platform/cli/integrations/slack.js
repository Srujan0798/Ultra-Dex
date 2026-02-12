// Copyright (c) 2026 Ultra-Dex

/**
 * cli/lib/integrations/slack.js
 * Slack Integration with Real API Implementation
 */

import crypto from 'crypto';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { requireConfig, retryWithBackoff } from './utils.js';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';

const SLACK_API_BASE = 'https://slack.com/api';

export class SlackClient {
  constructor(token) {
    requireConfig({ token }, ['token'], 'Slack');
    this.token = token;
  }

  get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async sendMessage(channel, text, options = {}) {
    try {
      const payload = {
        channel,
        text,
        ...options,
      };

      const response = await retryWithBackoff(() =>
        fetch(`${SLACK_API_BASE}/chat.postMessage`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Message sent to Slack channel: ${channel}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to send Slack message: ${error.message}`);
      throw error;
    }
  }

  async sendRichMessage(channel, blocks, text = 'Notification') {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${SLACK_API_BASE}/chat.postMessage`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            channel,
            text,
            blocks,
          }),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Rich message sent to Slack channel: ${channel}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to send rich Slack message: ${error.message}`);
      throw error;
    }
  }

  async createChannel(name, isPrivate = false) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${SLACK_API_BASE}/conversations.create`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            name,
            is_private: isPrivate,
          }),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Created Slack channel: #${name}`);
        return result.channel;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to create Slack channel: ${error.message}`);
      throw error;
    }
  }

  async joinChannel(channelId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${SLACK_API_BASE}/conversations.join`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            channel: channelId,
          }),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Joined Slack channel: ${channelId}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to join Slack channel: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(channelId, filePath, title, initialComment = '') {
    try {
      const fileContent = await fs.readFile(filePath);
      const formData = new FormData();
      formData.append('file', fileContent, { filename: path.basename(filePath) });
      formData.append('channels', channelId);
      formData.append('title', title);
      if (initialComment) {
        formData.append('initial_comment', initialComment);
      }

      const response = await fetch(`${SLACK_API_BASE}/files.upload`, {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Uploaded file to Slack: ${path.basename(filePath)}`);
        return result.file;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to upload file to Slack: ${error.message}`);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const response = await fetch(
        `${SLACK_API_BASE}/users.lookupByEmail?email=${encodeURIComponent(email)}`,
        {
          headers: this.headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        return result.user;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to lookup Slack user by email: ${error.message}`);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const response = await fetch(`${SLACK_API_BASE}/users.info?user=${userId}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        return result.user;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to get Slack user info: ${error.message}`);
      throw error;
    }
  }

  async listChannels(excludeArchived = true, types = ['public_channel', 'private_channel']) {
    try {
      const response = await fetch(
        `${SLACK_API_BASE}/conversations.list?exclude_archived=${excludeArchived}&types=${types.join(',')}`,
        {
          headers: this.headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        return result.channels;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to list Slack channels: ${error.message}`);
      throw error;
    }
  }

  async getChannelInfo(channelId) {
    try {
      const response = await fetch(`${SLACK_API_BASE}/conversations.info?channel=${channelId}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        return result.channel;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to get Slack channel info: ${error.message}`);
      throw error;
    }
  }

  async getChannelHistory(channelId, options = {}) {
    try {
      const params = new URLSearchParams({
        channel: channelId,
        ...options,
      });

      const response = await fetch(`${SLACK_API_BASE}/conversations.history?${params}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        return result.messages;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to get Slack channel history: ${error.message}`);
      throw error;
    }
  }

  async setChannelTopic(channelId, topic) {
    try {
      const response = await fetch(`${SLACK_API_BASE}/conversations.setTopic`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          channel: channelId,
          topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Updated Slack channel topic: ${topic}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to set Slack channel topic: ${error.message}`);
      throw error;
    }
  }

  async setChannelPurpose(channelId, purpose) {
    try {
      const response = await fetch(`${SLACK_API_BASE}/conversations.setPurpose`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          channel: channelId,
          purpose,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Updated Slack channel purpose: ${purpose}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to set Slack channel purpose: ${error.message}`);
      throw error;
    }
  }

  async inviteUserToChannel(channelId, userId) {
    try {
      const response = await fetch(`${SLACK_API_BASE}/conversations.invite`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          channel: channelId,
          users: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Slack API Error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      if (result.ok) {
        printSuccess(`✅ Invited user to Slack channel: ${channelId}`);
        return result;
      } else {
        throw new Error(`Slack API Error: ${result.error}`);
      }
    } catch (error) {
      printError(`Failed to invite user to Slack channel: ${error.message}`);
      throw error;
    }
  }

  async sendNotificationToChannel(channel, message, options = {}) {
    try {
      // Create a rich notification with blocks
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: options.title || 'Ultra-Dex Notification',
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

      if (options.fields) {
        blocks.push({
          type: 'section',
          fields: options.fields.map((field) => ({
            type: 'mrkdwn',
            text: `*${field.title}*:\n${field.value}`,
          })),
        });
      }

      if (options.actions) {
        blocks.push({
          type: 'actions',
          elements: options.actions.map((action) => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: action.text,
            },
            action_id: action.id,
            ...(action.style && { style: action.style }),
          })),
        });
      }

      return await this.sendRichMessage(channel, blocks, message);
    } catch (error) {
      printError(`Failed to send Slack notification: ${error.message}`);
      throw error;
    }
  }

  async sendDeploymentNotification(channel, deploymentInfo) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 Deployment Status',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Environment:*\n${deploymentInfo.environment}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${deploymentInfo.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Branch:*\n${deploymentInfo.branch}`,
          },
          {
            type: 'mrkdwn',
            text: `*Commit:*\n${deploymentInfo.commit?.substring(0, 8) || 'N/A'}`,
          },
        ],
      },
    ];

    if (deploymentInfo.url) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔗 <${deploymentInfo.url}|View Deployment>`,
        },
      });
    }

    if (deploymentInfo.status === 'success') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':white_check_mark: Deployment completed successfully',
          },
        ],
      });
    } else if (deploymentInfo.status === 'failure') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':x: Deployment failed - please investigate',
          },
        ],
      });
    }

    return await this.sendRichMessage(channel, blocks, `Deployment ${deploymentInfo.status}`);
  }

  async sendBuildNotification(channel, buildInfo) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔨 Build Status',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Project:*\n${buildInfo.project}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${buildInfo.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${buildInfo.duration}`,
          },
          {
            type: 'mrkdwn',
            text: `*Commit:*\n${buildInfo.commit?.substring(0, 8) || 'N/A'}`,
          },
        ],
      },
    ];

    if (buildInfo.artifacts) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📦 Artifacts: ${buildInfo.artifacts.join(', ')}`,
        },
      });
    }

    if (buildInfo.status === 'success') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':white_check_mark: Build completed successfully',
          },
        ],
      });
    } else if (buildInfo.status === 'failure') {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':x: Build failed - please check logs',
          },
        ],
      });
    }

    return await this.sendRichMessage(channel, blocks, `Build ${buildInfo.status}`);
  }
}

export function verifySlackSignature({ signingSecret, timestamp, signature, body }) {
  if (!signingSecret || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;

  // Prevent replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 60 * 5) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const digest = crypto
    .createHmac('sha256', signingSecret)
    .update(baseString, 'utf8')
    .digest('hex');
  const expected = `v0=${digest}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function parseSlackPayload(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    const params = new URLSearchParams(body);
    const payload = params.get('payload');
    if (payload) {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }
    return null;
  }

  if (body.payload) {
    try {
      return typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload;
    } catch {
      return null;
    }
  }

  return body;
}

export async function handleSlackInteractiveRequest({ signingSecret, headers, body, onAction }) {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  const timestamp =
    headers?.['x-slack-request-timestamp'] || headers?.['X-Slack-Request-Timestamp'];
  const signature = headers?.['x-slack-signature'] || headers?.['X-Slack-Signature'];

  const valid = verifySlackSignature({
    signingSecret,
    timestamp,
    signature,
    body: rawBody,
  });

  if (!valid) {
    return { ok: false, status: 401, error: 'Invalid Slack signature' };
  }

  const payload = parseSlackPayload(body);
  if (!payload) {
    return { ok: false, status: 400, error: 'Invalid Slack payload' };
  }

  if (payload.type === 'block_actions' && typeof onAction === 'function') {
    const result = await onAction(payload);
    return { ok: true, status: 200, result };
  }

  return { ok: true, status: 200, payload };
}

/**
 * Validate Slack configuration
 */
export async function validateSlackConfig(config) {
  if (!config.token) {
    throw new Error('Slack configuration requires token');
  }

  const client = new SlackClient(config.token);

  try {
    // Test by fetching auth information
    const response = await fetch(`${SLACK_API_BASE}/auth.test`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });

    if (!response.ok) {
      throw new Error(`Slack connection test failed: ${response.status} ${response.statusText}`);
    }

    const authInfo = await response.json();
    printSuccess(`✅ Slack connection validated for workspace: ${authInfo.team}`);
    return true;
  } catch (error) {
    printError(`❌ Slack connection failed: ${error.message}`);
    return false;
  }
}

export default {
  SlackClient,
  validateSlackConfig,
  verifySlackSignature,
  parseSlackPayload,
  handleSlackInteractiveRequest,
};
