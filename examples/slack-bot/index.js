#!/usr/bin/env node

/**
 * Ultra-Dex Slack Bot
 * 
 * This example demonstrates how to create a Slack bot that integrates with Ultra-Dex AI agents
 * to provide intelligent responses and actions within Slack conversations.
 * 
 * Features:
 * - Natural language processing for Slack commands
 * - Integration with multiple AI agents
 * - Context-aware responses
 * - Task execution and reporting
 */

import { WebClient } from '@slack/web-api';
import { RTMClient } from '@slack/rtm-api';
import { UltraDex } from '@ultra-dex/sdk';

class SlackBot {
  constructor(config) {
    this.slack = new WebClient(config.slackToken);
    this.rtm = new RTMClient(config.slackToken);
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      questionAnswerer: this.ultraDex.createAgent({
        name: 'question-answerer',
        role: 'Answers questions based on available knowledge and context',
        tools: ['search', 'knowledge-base', 'context-analyzer']
      }),
      
      taskExecutor: this.ultraDex.createAgent({
        name: 'task-executor',
        role: 'Executes tasks and provides status updates',
        tools: ['task-orchestrator', 'status-tracker', 'notification-sender']
      }),
      
      summarizer: this.ultraDex.createAgent({
        name: 'summarizer',
        role: 'Summarizes long documents, threads, or conversations',
        tools: ['text-analyzer', 'summary-generator', 'key-point-extractor']
      }),
      
      codeHelper: this.ultraDex.createAgent({
        name: 'code-helper',
        role: 'Provides code suggestions, reviews, and explanations',
        tools: ['code-analyzer', 'syntax-checker', 'best-practices-checker']
      }),
      
      scheduler: this.ultraDex.createAgent({
        name: 'scheduler',
        role: 'Helps schedule meetings and manage calendars',
        tools: ['calendar-integration', 'availability-checker', 'timezone-converter']
      })
    };
    
    // Maintain conversation context
    this.context = new Map();
  }

  /**
   * Initialize the bot
   */
  async init() {
    // Connect to Slack RTM
    await this.rtm.start();
    
    // Listen for messages
    this.rtm.on('message', async (message) => {
      if (message.text && !message.bot_id) { // Ignore bot messages
        await this.handleMessage(message);
      }
    });
    
    console.log('Slack bot initialized and listening for messages...');
  }

  /**
   * Handle incoming Slack messages
   */
  async handleMessage(message) {
    try {
      // Get channel info
      const channelInfo = await this.slack.conversations.info({ channel: message.channel });
      
      // Prepare context for the agent
      const context = {
        userId: message.user,
        channelId: message.channel,
        channelName: channelInfo.channel.name,
        text: message.text,
        timestamp: message.ts,
        threadTs: message.thread_ts || message.ts
      };
      
      // Determine intent and route to appropriate agent
      const intent = await this.determineIntent(message.text);
      
      let response;
      switch (intent.type) {
        case 'question':
          response = await this.handleQuestion(context, intent.query);
          break;
          
        case 'task':
          response = await this.handleTask(context, intent.task);
          break;
          
        case 'summarize':
          response = await this.handleSummary(context, intent.target);
          break;
          
        case 'code':
          response = await this.handleCodeRequest(context, intent.query);
          break;
          
        case 'schedule':
          response = await this.handleScheduling(context, intent.request);
          break;
          
        default:
          response = await this.handleGeneralQuery(context);
          break;
      }
      
      // Send response back to Slack
      await this.slack.chat.postMessage({
        channel: message.channel,
        text: response,
        thread_ts: message.thread_ts // Continue thread if it's a threaded message
      });
      
    } catch (error) {
      console.error('Error handling message:', error);
      await this.slack.chat.postMessage({
        channel: message.channel,
        text: 'Sorry, I encountered an error processing your request. Please try again.'
      });
    }
  }

  /**
   * Determine the intent of a message
   */
  async determineIntent(text) {
    // Simple intent detection - in production, use more sophisticated NLP
    text = text.toLowerCase();
    
    if (text.includes('?') || text.includes('what') || text.includes('how') || text.includes('when') || text.includes('who') || text.includes('why')) {
      return { type: 'question', query: text };
    }
    
    if (text.includes('summarize') || text.includes('summary') || text.includes('brief') || text.includes('overview')) {
      return { type: 'summarize', target: text.replace(/summarize|summary|brief|overview/i, '').trim() || 'last_thread' };
    }
    
    if (text.includes('code') || text.includes('programming') || text.includes('javascript') || text.includes('python') || text.includes('debug')) {
      return { type: 'code', query: text };
    }
    
    if (text.includes('schedule') || text.includes('meeting') || text.includes('calendar') || text.includes('availability')) {
      return { type: 'schedule', request: text };
    }
    
    // Default to task execution for action-oriented messages
    return { type: 'task', task: text };
  }

  /**
   * Handle question-answering requests
   */
  async handleQuestion(context, query) {
    const result = await this.agents.questionAnswerer.execute({
      query: query,
      channelContext: context.channelName,
      user: context.userId,
      conversationHistory: this.getContextHistory(context.channelId)
    });
    
    return result.response;
  }

  /**
   * Handle task execution requests
   */
  async handleTask(context, task) {
    const result = await this.agents.taskExecutor.execute({
      task: task,
      user: context.userId,
      channel: context.channelName,
      priority: 'normal'
    });
    
    return result.status || 'Task completed successfully';
  }

  /**
   * Handle summarization requests
   */
  async handleSummary(context, target) {
    let contentToSummarize = '';
    
    if (target === 'last_thread') {
      // Get the last few messages in the thread
      const history = await this.slack.conversations.history({
        channel: context.channelId,
        oldest: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
        inclusive: true
      });
      
      contentToSummarize = history.messages.slice(0, 10).map(msg => msg.text).join('\n');
    } else {
      contentToSummarize = target;
    }
    
    const result = await this.agents.summarizer.execute({
      content: contentToSummarize,
      maxLength: 200
    });
    
    return `📝 Summary:\n${result.summary}`;
  }

  /**
   * Handle code-related requests
   */
  async handleCodeRequest(context, query) {
    const result = await this.agents.codeHelper.execute({
      request: query,
      languageHints: this.detectLanguageHints(query),
      context: {
        channel: context.channelName,
        user: context.userId
      }
    });
    
    return `\`\`\`${result.language || 'javascript'}\n${result.code}\n\`\`\`${result.explanation ? `\n${result.explanation}` : ''}`;
  }

  /**
   * Handle scheduling requests
   */
  async handleScheduling(context, request) {
    const result = await this.agents.scheduler.execute({
      request: request,
      requester: context.userId,
      participants: [context.userId], // In a real implementation, extract participants from the request
      duration: 30 // Default to 30 minutes
    });
    
    return result.confirmation || 'Meeting scheduled successfully!';
  }

  /**
   * Handle general queries
   */
  async handleGeneralQuery(context) {
    const result = await this.agents.questionAnswerer.execute({
      query: context.text,
      channelContext: context.channelName,
      user: context.userId,
      conversationHistory: this.getContextHistory(context.channelId)
    });
    
    return result.response;
  }

  /**
   * Detect programming language hints in the query
   */
  detectLanguageHints(query) {
    const languages = ['javascript', 'python', 'java', 'go', 'rust', 'typescript', 'c++', 'c#', 'php', 'ruby'];
    const lowerQuery = query.toLowerCase();
    
    return languages.filter(lang => lowerQuery.includes(lang));
  }

  /**
   * Get conversation history for context
   */
  getContextHistory(channelId) {
    // In a real implementation, store and retrieve conversation history
    return [];
  }
}

// Example usage
async function main() {
  const bot = new SlackBot({
    slackToken: process.env.SLACK_BOT_TOKEN,
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    }
  });
  
  await bot.init();
}

if (require.main === module) {
  main().catch(console.error);
}

export default SlackBot;