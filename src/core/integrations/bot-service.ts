import { singleton } from 'tsyringe';
import { logger } from '../monitoring/better-stack-logger.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';

export interface BotConfig {
  type: 'slack' | 'discord';
  token: string;
  signingSecret?: string;
  appId?: string;
}

@singleton()
export class BotService {
  private bots: Map<string, any> = new Map();

  constructor() {}

  async initialize(configs: BotConfig[]): Promise<void> {
    for (const config of configs) {
      if (config.type === 'slack') {
        await this.initSlackBot(config);
      } else if (config.type === 'discord') {
        await this.initDiscordBot(config);
      }
    }
  }

  private async initSlackBot(config: BotConfig): Promise<void> {
    try {
      // In real implementation, use @slack/bolt
      logger.info('Initializing Slack bot...', { appId: config.appId });
      this.bots.set(`slack:${config.appId || 'default'}`, { type: 'slack', status: 'ready' });
    } catch (error) {
      logger.error('Failed to init Slack bot', { error: String(error) });
    }
  }

  private async initDiscordBot(config: BotConfig): Promise<void> {
    try {
      // In real implementation, use discord.js
      logger.info('Initializing Discord bot...');
      this.bots.set('discord:default', { type: 'discord', status: 'ready' });
    } catch (error) {
      logger.error('Failed to init Discord bot', { error: String(error) });
    }
  }

  async handleMessage(botId: string, channelId: string, userId: string, text: string): Promise<string> {
    logger.info('Bot message received', { botId, userId, textLength: text.length });
    
    // Simple AI response
    try {
      const result = await aiMetaLayer.call('gpt-4o', [
        { role: 'system', content: 'You are Ultra-Dex Bot, a helpful AI orchestration assistant.' },
        { role: 'user', content: text }
      ]);
      
      return result.text || 'I processed your request but have no text response.';
    } catch (error) {
      logger.error('Bot AI call failed', { error: String(error) });
      return 'Sorry, I encountered an error processing your request.';
    }
  }
}

export const botService = new BotService();
