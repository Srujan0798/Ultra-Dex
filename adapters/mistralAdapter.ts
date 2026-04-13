/**
 * Mistral AI Adapter for Ultra-Dex
 * 
 * Supports Mistral Small, Medium, Large, and embedding models.
 * Implements rate limiting with exponential backoff.
 * 
 * @module adapters/mistralAdapter
 */

import { BaseAdapter, AdapterConfig, LLMResponse, TokenUsage } from './base.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MistralConfig extends AdapterConfig {
  model?: 'mistral-large-latest' | 'mistral-medium-latest' | 'mistral-small-latest' | 'codestral-latest';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  safeMode?: boolean;
  tools?: MistralTool[];
}

interface MistralTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

interface MistralMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  safe_prompt?: boolean;
  tools?: MistralTool[];
  tool_choice?: 'auto' | 'any' | 'none';
  stream?: boolean;
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: MistralMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mistral Adapter
// ─────────────────────────────────────────────────────────────────────────────

export class MistralAdapter extends BaseAdapter {
  private apiKey: string;
  private baseURL = 'https://api.mistral.ai/v1';
  private config: Required<Pick<MistralConfig, 'model' | 'temperature' | 'maxTokens' | 'topP' | 'safeMode'>> &
    Pick<MistralConfig, 'tools'>;

  constructor(config: MistralConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.MISTRAL_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Mistral API key required (config.apiKey or MISTRAL_API_KEY env var)');
    }

    this.config = {
      model: config.model || 'mistral-large-latest',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      topP: config.topP ?? 1,
      safeMode: config.safeMode ?? false,
      tools: config.tools,
    };
  }

  get name(): string {
    return `mistral-${this.config.model}`;
  }

  get model(): string {
    return this.config.model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    return this.withRetry(async () => {
      const messages: MistralMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const request: MistralRequest = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        top_p: this.config.topP,
        safe_prompt: this.config.safeMode,
      };

      if (this.config.tools && this.config.tools.length > 0) {
        request.tools = this.config.tools;
        request.tool_choice = 'auto';
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mistral API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as MistralResponse;
      return this.formatResponse(data);
    });
  }

  async *stream(prompt: string, systemPrompt?: string): AsyncGenerator<string, void, unknown> {
    const messages: MistralMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const request: MistralRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      top_p: this.config.topP,
      safe_prompt: this.config.safeMode,
      stream: true,
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral streaming error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                yield delta;
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
  }

  getPricing(): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'mistral-large-latest': { input: 0.000002, output: 0.000006 },
      'mistral-medium-latest': { input: 0.0000007, output: 0.0000019 },
      'mistral-small-latest': { input: 0.0000002, output: 0.0000006 },
      'codestral-latest': { input: 0.000001, output: 0.000003 },
    };
    return pricing[this.config.model] || pricing['mistral-large-latest'];
  }

  private formatResponse(data: MistralResponse): LLMResponse {
    const message = data.choices[0].message;
    const content = message.content;

    // Parse tool calls if present
    const toolCalls = message.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

    const usage: TokenUsage = {
      prompt: data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    };

    return {
      content,
      toolCalls,
      model: data.model,
      usage,
      cost: this.calculateCost(usage),
    };
  }

  protected calculateCost(usage: TokenUsage): number {
    const pricing = this.getPricing();
    return (usage.prompt * pricing.input) + (usage.completion * pricing.output);
  }
}

// Factory function for convenience
export function createMistralAdapter(config?: Omit<MistralConfig, 'apiKey'>): MistralAdapter {
  return new MistralAdapter({
    apiKey: process.env.MISTRAL_API_KEY || '',
    ...config,
  });
}
