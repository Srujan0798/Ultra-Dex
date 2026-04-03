// Copyright (c) 2026 Ultra-Dex — Azure OpenAI Provider

import { AzureOpenAI } from '@azure/openai';
import { BaseProvider } from '../../../src/services/ai-providers/base-provider.js';

export class AzureOpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super('azure-openai', config);
    this.client = new AzureOpenAI({
      endpoint: config.endpoint || process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: config.apiKey || process.env.AZURE_OPENAI_API_KEY,
      apiVersion: config.apiVersion || '2024-02-15-preview',
      deployment: config.deployment || 'gpt-4',
    });
    this.defaultModel = config.defaultModel || 'gpt-4';
  }

  _authHeaders() {
    // Azure SDK handles authentication
    return {};
  }

  async chat(messages, options = {}) {
    const messagesFormatted = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const result = await this.client.chat.completions.create({
        messages: messagesFormatted,
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      });

      const choice = result.choices[0];
      return {
        content: choice.message.content,
        usage: {
          inputTokens: result.usage?.prompt_tokens || 0,
          outputTokens: result.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`Azure OpenAI error: ${error.message}`);
    }
  }

  async *streamChat(messages, options = {}) {
    const messagesFormatted = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const stream = await this.client.chat.completions.create({
        messages: messagesFormatted,
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield { content: delta, done: false };
        }
      }

      yield { content: '', done: true };
    } catch (error) {
      throw new Error(`Azure OpenAI streaming error: ${error.message}`);
    }
  }
}
