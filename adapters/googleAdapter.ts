/**
 * Ultra-Dex Google Gemini Adapter
 *
 * Production adapter for Google's Gemini models.
 */

import type { ExecutionAdapter, ExecutionContext, ExecutionResult, Cost } from './executionAdapter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Google Gemini Types
// ──────────────────────────────────────────────────────────────────────────────

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: GeminiContent;
    finishReason: string;
    safetyRatings: unknown[];
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Google Adapter Config
// ──────────────────────────────────────────────────────────────────────────────

export interface GoogleAdapterConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxRetries?: number;
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Google Gemini Adapter
// ──────────────────────────────────────────────────────────────────────────────

export class GoogleAdapter implements ExecutionAdapter {
  private config: Required<GoogleAdapterConfig>;
  private activeRequests = new Map<string, AbortController>();

  constructor(config: GoogleAdapterConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      maxRetries: 3,
      timeoutMs: 120_000,
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Google API key is required');
    }
  }

  name(): string {
    return `google:${this.config.model}`;
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    const controller = new AbortController();
    this.activeRequests.set(context.nodeId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, context.timeout ?? this.config.timeoutMs);

    try {
      const contents: GeminiContent[] = [
        {
          role: 'user',
          parts: [{
            text: `You are an AI agent in an Ultra-Dex workflow. Task type: ${context.taskType}.\n\nExecute this task:\n${JSON.stringify(context.input, null, 2)}`,
          }],
        },
      ];

      const response = await this.makeRequest(contents, controller.signal);
      clearTimeout(timeoutId);

      const candidate = response.candidates[0];
      if (!candidate) {
        throw new Error('No response from Google Gemini');
      }

      const content = candidate.content.parts.map(p => p.text).join('');
      
      const cost = this.calculateCost(
        response.usageMetadata.promptTokenCount,
        response.usageMetadata.candidatesTokenCount,
      );

      return {
        status: 'SUCCESS',
        output: content,
        logs: [`Google ${this.config.model} completed`],
        cost,
        confidence: 0.92,
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

  private async makeRequest(contents: GeminiContent[], signal: AbortSignal): Promise<GeminiResponse> {
    const url = `${this.config.baseURL}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    const requestBody: GeminiRequest = {
      contents,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: 0.95,
        topK: 40,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<GeminiResponse>;
  }

  private calculateCost(inputTokens: number, outputTokens: number): Cost {
    // Pricing as of 2024 (may need updates)
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-1.5-pro': { input: 3.5, output: 10.5 },
      'gemini-1.5-flash': { input: 0.35, output: 1.05 },
      'gemini-1.0-pro': { input: 0.5, output: 1.5 },
    };

    const modelPricing = pricing[this.config.model] ?? pricing['gemini-1.5-flash'];
    const totalTokens = inputTokens + outputTokens;
    const costUSD = (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1_000_000;

    return {
      tokens: totalTokens,
      estimatedUSD: costUSD,
      provider: this.name(),
    };
  }
}
