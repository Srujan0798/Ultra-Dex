// Copyright (c) 2026 Ultra-Dex — AWS Bedrock AI Provider

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BaseProvider } from '../../../src/services/ai-providers/base-provider.js';

export class AWSBedrockProvider extends BaseProvider {
  constructor(config = {}) {
    super('aws-bedrock', config);
    this.client = new BedrockRuntimeClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.defaultModel = config.defaultModel || 'anthropic.claude-3-sonnet-20240229-v1:0';
  }

  _authHeaders() {
    // AWS SDK handles authentication
    return {};
  }

  async chat(messages, options = {}) {
    const modelId = options.model || this.defaultModel;
    const body = {
      prompt: this._formatMessages(messages),
      max_tokens_to_sample: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 1,
      top_k: options.topK || 250,
    };

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(body),
      contentType: 'application/json',
      accept: 'application/json',
    });

    try {
      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      return {
        content: result.completion,
        usage: {
          inputTokens: result.usage?.input_tokens || 0,
          outputTokens: result.usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`AWS Bedrock error: ${error.message}`);
    }
  }

  _formatMessages(messages) {
    return (
      messages
        .map((msg) => {
          if (msg.role === 'user') return `\n\nHuman: ${msg.content}`;
          if (msg.role === 'assistant') return `\n\nAssistant: ${msg.content}`;
          return msg.content;
        })
        .join('') + '\n\nAssistant:'
    );
  }

  async *streamChat(messages, options = {}) {
    // Streaming not implemented for simplicity
    const result = await this.chat(messages, options);
    yield { content: result.content, done: true };
  }
}
