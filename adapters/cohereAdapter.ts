/**
 * Cohere Adapter for Ultra-Dex
 * 
 * Supports Command R, Command R+, and embedding models.
 * Implements rate limiting with exponential backoff.
 * 
 * @module adapters/cohereAdapter
 */

import { BaseAdapter, AdapterConfig, LLMResponse, TokenUsage } from './base.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CohereConfig extends AdapterConfig {
  model?: 'command-r' | 'command-r-plus' | 'command' | 'command-light';
  temperature?: number;
  maxTokens?: number;
  preamble?: string;
  tools?: CohereTool[];
}

interface CohereTool {
  name: string;
  description: string;
  parameterDefinitions: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
}

interface CohereRequest {
  model: string;
  message: string;
  preamble?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: CohereTool[];
  chat_history?: Array<{ role: 'USER' | 'CHATBOT'; message: string }>;
}

interface CohereResponse {
  text: string;
  finish_reason: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR';
  meta: {
    billed_units: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  tool_calls?: Array<{
    name: string;
    parameters: Record<string, unknown>;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cohere Adapter
// ─────────────────────────────────────────────────────────────────────────────

export class CohereAdapter extends BaseAdapter {
  private apiKey: string;
  private baseURL = 'https://api.cohere.com/v1';
  private config: Required<Pick<CohereConfig, 'model' | 'temperature' | 'maxTokens'>> &
    Pick<CohereConfig, 'preamble' | 'tools'>;

  constructor(config: CohereConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.COHERE_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Cohere API key required (config.apiKey or COHERE_API_KEY env var)');
    }

    this.config = {
      model: config.model || 'command-r',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      preamble: config.preamble,
      tools: config.tools,
    };
  }

  get name(): string {
    return `cohere-${this.config.model}`;
  }

  get model(): string {
    return this.config.model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    return this.withRetry(async () => {
      const request: CohereRequest = {
        model: this.config.model,
        message: prompt,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        preamble: systemPrompt || this.config.preamble,
      };

      if (this.config.tools && this.config.tools.length > 0) {
        request.tools = this.config.tools;
      }

      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cohere API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as CohereResponse;
      
      return this.formatResponse(data);
    });
  }

  async *stream(prompt: string, systemPrompt?: string): AsyncGenerator<string, void, unknown> {
    const request: CohereRequest & { stream: true } = {
      model: this.config.model,
      message: prompt,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      preamble: systemPrompt || this.config.preamble,
      stream: true,
    };

    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere streaming error: ${response.status} - ${error}`);
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
              if (parsed.text) {
                yield parsed.text;
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
    const response = await fetch(`${this.baseURL}/embed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [text],
        model: 'embed-english-v3.0',
        input_type: 'search_document',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { embeddings: number[][] };
    return data.embeddings[0];
  }

  getPricing(): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'command-r': { input: 0.0000005, output: 0.0000015 },
      'command-r-plus': { input: 0.000003, output: 0.000015 },
      'command': { input: 0.000001, output: 0.000002 },
      'command-light': { input: 0.0000003, output: 0.0000006 },
    };
    return pricing[this.config.model] || pricing['command-r'];
  }

  private formatResponse(data: CohereResponse): LLMResponse {
    const content = data.text;
    
    // Parse tool calls if present
    const toolCalls = data.tool_calls?.map(tc => ({
      name: tc.name,
      arguments: tc.parameters,
    }));

    // Extract thinking if present in XML tags
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const thinking = thinkingMatch ? thinkingMatch[1].trim() : undefined;
    const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

    const usage: TokenUsage = {
      prompt: data.meta.billed_units.input_tokens,
      completion: data.meta.billed_units.output_tokens,
      total: data.meta.billed_units.input_tokens + data.meta.billed_units.output_tokens,
    };

    return {
      content: cleanContent,
      thinking,
      toolCalls,
      model: this.config.model,
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
export function createCohereAdapter(config?: Omit<CohereConfig, 'apiKey'>): CohereAdapter {
  return new CohereAdapter({
    apiKey: process.env.COHERE_API_KEY || '',
    ...config,
  });
}
