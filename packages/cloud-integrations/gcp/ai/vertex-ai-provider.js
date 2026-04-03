// Copyright (c) 2026 Ultra-Dex — GCP Vertex AI Provider

import { VertexAI } from '@google-cloud/aiplatform';
import { BaseProvider } from '../../../src/services/ai-providers/base-provider.js';

export class GCPVertexAIProvider extends BaseProvider {
  constructor(config = {}) {
    super('gcp-vertex-ai', config);
    this.client = new VertexAI({
      project: config.projectId || process.env.GCP_PROJECT_ID,
      location: config.location || process.env.GCP_LOCATION || 'us-central1',
      apiEndpoint: config.apiEndpoint,
    });
    this.defaultModel = config.defaultModel || 'gemini-pro';
  }

  _authHeaders() {
    // GCP client libraries handle authentication
    return {};
  }

  async chat(messages, options = {}) {
    const model = this.client.getGenerativeModel({
      model: options.model || this.defaultModel,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        topP: options.topP || 1,
        topK: options.topK || 40,
      },
    });

    const chat = model.startChat({});
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    if (history.length > 0) {
      chat._history = history;
    }

    try {
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      throw new Error(`GCP Vertex AI error: ${error.message}`);
    }
  }

  async *streamChat(messages, options = {}) {
    const model = this.client.getGenerativeModel({
      model: options.model || this.defaultModel,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        topP: options.topP || 1,
        topK: options.topK || 40,
      },
    });

    const chat = model.startChat({});
    const lastMessage = messages[messages.length - 1];

    try {
      const streamingResponse = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of streamingResponse.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield { content: chunkText, done: false };
        }
      }

      yield { content: '', done: true };
    } catch (error) {
      throw new Error(`GCP Vertex AI streaming error: ${error.message}`);
    }
  }
}
