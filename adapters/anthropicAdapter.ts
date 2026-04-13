/**
 * Ultra-Dex Anthropic Adapter
 *
 * Production adapter for Anthropic Claude models.
 */

import type { ExecutionAdapter, ExecutionContext, ExecutionResult, Cost } from './executionAdapter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Anthropic Types
// ──────────────────────────────────────────────────────────────────────────────

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: { type: string; text: string }[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Anthropic Adapter Config
// ──────────────────────────────────────────────────────────────────────────────

export interface AnthropicAdapterConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxRetries?: number;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Anthropic Adapter
// ──────────────────────────────────────────────────────────────────────────────

export class AnthropicAdapter implements ExecutionAdapter {
  private config: Required<AnthropicAdapterConfig>;
  private activeRequests = new Map<string, AbortController>();

  constructor(config: AnthropicAdapterConfig) {
    this.config = {
      model: 'claude-3-sonnet-20240229',
      baseURL: 'https://api.anthropic.com/v1',
      maxRetries: 3,
      timeoutMs: 120_000,
      maxTokens: 4096,
      temperature: 0.7,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  name(): string {
    return `anthropic:${this.config.model}`;
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    const controller = new AbortController();
    this.activeRequests.set(context.nodeId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, context.timeout ?? this.config.timeoutMs);

    try {
      const systemPrompt = `You are an AI agent in an Ultra-Dex workflow. Task type: ${context.taskType}. Execute the following instruction:`;
      
      const messages: AnthropicMessage[] = [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${JSON.stringify(context.input, null, 2)}`,
        },
      ];

      const response = await this.makeRequest(messages, controller.signal);
      clearTimeout(timeoutId);

      const content = response.content.find(c => c.type === 'text')?.text ?? '';
      
      const cost = this.calculateCost(
        response.usage.input_tokens,
        response.usage.output_tokens,
      );

      return {
        status: 'SUCCESS',
        output: content,
        logs: [`Anthropic ${this.config.model} completed`],
        cost,
        confidence: 0.95,
        duration: 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        return {
          status: 'FAILED',
          logs: ['Request timed out'],
          error: `Timeout after ${this.config.timeoutMs}ms`,
          cost: { tokens: 0, estimatedUSD: 0, provider: this.name() },
          confidence: 0,
          duration: this.config.timeoutMs,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'FAILED',
        logs: [(error as Error).message],
        error: (error as Error).message,
        cost: { tokens: 0, estimatedUSD: 0, provider: this.name() },
        confidence: 0,
        duration: 0,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.activeRequests.delete(context.nodeId);
    }
  }

  async cancel(nodeId: string): Promise<void> {
    const controller = this.activeRequests.get(nodeId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(nodeId);
    }
  }

  async status(nodeId: string): Promise<{ running: boolean; progress?: number }> {
    return {
      running: this.activeRequests.has(nodeId),
      progress: this.activeRequests.has(nodeId) ? 0.5 : undefined,
    };
  }

  private async makeRequest(messages: AnthropicMessage[], signal: AbortSignal): Promise<AnthropicResponse> {
    const url = `${this.config.baseURL}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<AnthropicResponse>;
  }

  private calculateCost(inputTokens: number, outputTokens: number): Cost {
    // Pricing as of 2024 (may need updates)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    const modelPricing = pricing[this.config.model] ?? pricing['claude-3-sonnet-20240229'];
    const totalTokens = inputTokens + outputTokens;
    const costUSD = (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1_000_000;

    return {
      tokens: totalTokens,
      estimatedUSD: costUSD,
      provider: this.name(),
    };
  }
}
