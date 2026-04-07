// Copyright (c) 2026 Ultra-Dex

/**
 * cli/lib/integrations/discord.js
 * Discord Integration with Real API Implementation
 */

import { printSuccess, printError } from '../utils/output.js';
import { requireConfig, retryWithBackoff } from './utils.js';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export class DiscordClient {
  constructor(token) {
    requireConfig({ token }, ['token'], 'Discord');
    this.token = token;
  }

  get headers() {
    return {
      'Authorization': `Bot ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'DiscordBot (Ultra-Dex, 1.0)'
    };
  }

  async sendMessage(channelId, content, options = {}) {
    try {
      const payload = {
        content,
        ...options
      };

      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload)
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      printSuccess(`✅ Message sent to Discord channel: ${channelId}`);
      return result;
    } catch (error) {
      printError(`Failed to send Discord message: ${error.message}`);
      throw error;
    }
  }

  async sendEmbedMessage(channelId, embeds, content = '') {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            content,
            embeds
          })
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      printSuccess(`✅ Embed message sent to Discord channel: ${channelId}`);
      return result;
    } catch (error) {
      printError(`Failed to send Discord embed message: ${error.message}`);
      throw error;
    }
  }

  async createWebhook(channelId, name, avatar = null) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/channels/${channelId}/webhooks`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            name,
            avatar
          })
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const webhook = await response.json();
      printSuccess(`✅ Created Discord webhook: ${webhook.name}`);
      return webhook;
    } catch (error) {
      printError(`Failed to create Discord webhook: ${error.message}`);
      throw error;
    }
  }

  async executeWebhook(webhookId, webhookToken, messageData) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/webhooks/${webhookId}/${webhookToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord Webhook Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Executed Discord webhook: ${webhookId}`);
      return await response.json();
    } catch (error) {
      printError(`Failed to execute Discord webhook: ${error.message}`);
      throw error;
    }
  }

  async getGuild(guildId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord guild: ${error.message}`);
      throw error;
    }
  }

  async getChannel(channelId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord channel: ${error.message}`);
      throw error;
    }
  }

  async getGuildChannels(guildId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord guild channels: ${error.message}`);
      throw error;
    }
  }

  async createChannel(guildId, name, options = {}) {
    try {
      const payload = {
        name,
        type: options.type || 0, // 0 = text channel
        ...options
      };

      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload)
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const channel = await response.json();
      printSuccess(`✅ Created Discord channel: ${channel.name}`);
      return channel;
    } catch (error) {
      printError(`Failed to create Discord channel: ${error.message}`);
      throw error;
    }
  }

  async addRoleToMember(guildId, userId, roleId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
          method: 'PUT',
          headers: this.headers
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Added role ${roleId} to member ${userId}`);
      return true;
    } catch (error) {
      printError(`Failed to add role to member: ${error.message}`);
      throw error;
    }
  }

  async removeRoleFromMember(guildId, userId, roleId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
          method: 'DELETE',
          headers: this.headers
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Removed role ${roleId} from member ${userId}`);
      return true;
    } catch (error) {
      printError(`Failed to remove role from member: ${error.message}`);
      throw error;
    }
  }

  async createRole(guildId, roleData) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const role = await response.json();
      printSuccess(`✅ Created Discord role: ${role.name}`);
      return role;
    } catch (error) {
      printError(`Failed to create Discord role: ${error.message}`);
      throw error;
    }
  }

  async getGuildRoles(guildId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord guild roles: ${error.message}`);
      throw error;
    }
  }

  async assignRole(userId, guildId, roleId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
        method: 'PUT',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Assigned role ${roleId} to user ${userId}`);
      return true;
    } catch (error) {
      printError(`Failed to assign Discord role: ${error.message}`);
      throw error;
    }
  }

  async removeRole(userId, guildId, roleId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Removed role ${roleId} from user ${userId}`);
      return true;
    } catch (error) {
      printError(`Failed to remove Discord role: ${error.message}`);
      throw error;
    }
  }

  async getGuildMembers(guildId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 1000,
        after: options.after || undefined
      });

      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord guild members: ${error.message}`);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/users/${userId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord user: ${error.message}`);
      throw error;
    }
  }

  async getBotInfo() {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Discord bot info: ${error.message}`);
      throw error;
    }
  }

  async sendRichEmbed(channelId, title, description, fields = [], color = 0x00ff00) {
    const embed = {
      title,
      description,
      color,
      fields: fields.map(field => ({
        name: field.name,
        value: field.value,
        inline: field.inline || false
      })),
      timestamp: new Date().toISOString()
    };

    return await this.sendEmbedMessage(channelId, [embed]);
  }

  async sendDeploymentNotification(channelId, deploymentInfo) {
    const embed = {
      title: '🚀 Deployment Status',
      description: `Deployment to ${deploymentInfo.environment} environment`,
      color: deploymentInfo.status === 'success' ? 0x00ff00 : 0xff0000,
      fields: [
        {
          name: 'Status',
          value: deploymentInfo.status,
          inline: true
        },
        {
          name: 'Environment',
          value: deploymentInfo.environment,
          inline: true
        },
        {
          name: 'Branch',
          value: deploymentInfo.branch || 'main',
          inline: true
        },
        {
          name: 'Commit',
          value: deploymentInfo.commit?.substring(0, 8) || 'N/A',
          inline: true
        },
        {
          name: 'Duration',
          value: deploymentInfo.duration || 'N/A',
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Ultra-Dex Deployment System'
      }
    };

    if (deploymentInfo.url) {
      embed.url = deploymentInfo.url;
    }

    return await this.sendEmbedMessage(channelId, [embed], `Deployment ${deploymentInfo.status}`);
  }

  async sendBuildNotification(channelId, buildInfo) {
    const embed = {
      title: '🔨 Build Status',
      description: `Build ${buildInfo.status}`,
      color: buildInfo.status === 'success' ? 0x00ff00 : 0xff0000,
      fields: [
        {
          name: 'Project',
          value: buildInfo.project || 'Unknown',
          inline: true
        },
        {
          name: 'Status',
          value: buildInfo.status,
          inline: true
        },
        {
          name: 'Duration',
          value: buildInfo.duration || 'N/A',
          inline: true
        },
        {
          name: 'Commit',
          value: buildInfo.commit?.substring(0, 8) || 'N/A',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    if (buildInfo.artifacts && buildInfo.artifacts.length > 0) {
      embed.fields.push({
        name: 'Artifacts',
        value: buildInfo.artifacts.join(', '),
        inline: false
      });
    }

    if (buildInfo.status === 'failure' && buildInfo.error) {
      embed.fields.push({
        name: 'Error',
        value: buildInfo.error.substring(0, 1000), // Limit error length
        inline: false
      });
    }

    return await this.sendEmbedMessage(channelId, [embed], `Build ${buildInfo.status}`);
  }

  async sendAlert(channelId, alertInfo) {
    const embed = {
      title: `🚨 ${alertInfo.severity.toUpperCase()} Alert`,
      description: alertInfo.message,
      color: alertInfo.severity === 'critical' ? 0xff0000 : 
             alertInfo.severity === 'warning' ? 0xffff00 : 0xff9900,
      fields: [
        {
          name: 'Severity',
          value: alertInfo.severity,
          inline: true
        },
        {
          name: 'Service',
          value: alertInfo.service || 'Unknown',
          inline: true
        },
        {
          name: 'Timestamp',
          value: new Date(alertInfo.timestamp || Date.now()).toISOString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    if (alertInfo.details) {
      embed.fields.push({
        name: 'Details',
        value: alertInfo.details.substring(0, 1000),
        inline: false
      });
    }

    if (alertInfo.resolutionSteps) {
      embed.fields.push({
        name: 'Resolution Steps',
        value: alertInfo.resolutionSteps.join('\n'),
        inline: false
      });
    }

    return await this.sendEmbedMessage(channelId, [embed], `Alert: ${alertInfo.message}`);
  }

  async createThread(channelId, name, message) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/threads`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name,
          type: 11, // Private thread
          invitable: true,
          message: {
            content: message
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      const thread = await response.json();
      printSuccess(`✅ Created Discord thread: ${thread.name}`);
      return thread;
    } catch (error) {
      printError(`Failed to create Discord thread: ${error.message}`);
      throw error;
    }
  }

  async pinMessage(channelId, messageId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/pins/${messageId}`, {
        method: 'PUT',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Pinned message: ${messageId}`);
      return true;
    } catch (error) {
      printError(`Failed to pin Discord message: ${error.message}`);
      throw error;
    }
  }

  async unpinMessage(channelId, messageId) {
    try {
      const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/pins/${messageId}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || response.statusText}`);
      }

      printSuccess(`✅ Unpinned message: ${messageId}`);
      return true;
    } catch (error) {
      printError(`Failed to unpin Discord message: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Validate Discord configuration
 */
export async function validateDiscordConfig(config) {
  if (!config.token) {
    throw new Error('Discord configuration requires token');
  }

  const _client = new DiscordClient(config.token);
  
  try {
    // Test by fetching bot information
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: { 'Authorization': `Bot ${config.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Discord connection test failed: ${response.status} ${response.statusText}`);
    }

    const botInfo = await response.json();
    printSuccess(`✅ Discord connection validated for bot: ${botInfo.username}#${botInfo.discriminator}`);
    return true;
  } catch (error) {
    printError(`❌ Discord connection failed: ${error.message}`);
    return false;
  }
}

export default {
  DiscordClient,
  validateDiscordConfig
};
