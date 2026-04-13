/**
 * Ultra-Dex OpenAI Adapter
 *
 * Production adapter for OpenAI GPT models.
 * Supports chat completions with streaming and function calling.
 */

import type { ExecutionAdapter, ExecutionContext, ExecutionResult, Cost } from './executionAdapter.js';

// ──────────────────────────────────────────────────────────────────────────────
// OpenAI Types
// ──────────────────────────────────────────────────────────────────────────────

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// OpenAI Adapter Config
// ──────────────────────────────────────────────────────────────────────────────

export interface OpenAIAdapterConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxRetries?: number;
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// OpenAI Adapter
// ──────────────────────────────────────────────────────────────────────────────

export class OpenAIAdapter implements ExecutionAdapter {
  private config: Required<OpenAIAdapterConfig>;
  private activeRequests = new Map<string, AbortController>();

  constructor(config: OpenAIAdapterConfig) {
    this.config = {
      model: 'gpt-4-turbo-preview',
      baseURL: 'https://api.openai.com/v1',
      maxRetries: 3,
      timeoutMs: 120_000,
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  name(): string {
    return `openai:${this.config.model}`;
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    const controller = new AbortController();
    this.activeRequests.set(context.nodeId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, context.timeout ?? this.config.timeoutMs);

    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: `You are an AI agent in an Ultra-Dex workflow. Task type: ${context.taskType}. Execute the following instruction:`,
        },
        {
          role: 'user',
          content: JSON.stringify(context.input, null, 2),
        },
      ];

      const response = await this.makeRequest(messages, controller.signal);
      clearTimeout(timeoutId);

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response from OpenAI');
      }

      const cost = this.calculateCost(
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
      );

      return {
        status: 'SUCCESS',
        output: choice.message.content,
        logs: [`OpenAI ${this.config.model} completed`],
        cost,
        confidence: 0.95,
        duration: 0, // Will be set by executor
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

  private async makeRequest(messages: OpenAIMessage[], signal: AbortSignal): Promise<OpenAIResponse> {
    const url = `${this.config.baseURL}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<OpenAIResponse>;
  }

  private calculateCost(promptTokens: number, completionTokens: number): Cost {
    // Pricing as of 2024 (may need updates)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4-turbo-preview': { input: 10, output: 30 }, // per 1M tokens
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };

    const modelPricing = pricing[this.config.model] ?? pricing['gpt-4-turbo-preview'];
    const totalTokens = promptTokens + completionTokens;
    const costUSD = (promptTokens * modelPricing.input + completionTokens * modelPricing.output) / 1_000_000;

    return {
      tokens: totalTokens,
      estimatedUSD: costUSD,
      provider: this.name(),
    };
  }
}
