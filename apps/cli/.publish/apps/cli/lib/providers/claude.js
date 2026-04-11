// Copyright (c) 2026 Ultra-Dex

/**
 * Claude Sonnet 5 "Fennec" Integration
 * Adds support for Claude Sonnet 5 model with new capabilities
 */

import Anthropic from '@anthropic-ai/sdk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Claude Sonnet 5 model constant
export const CLAUDE_SONNET_5 = 'claude-sonnet-5-20260201';
export const CLAUDE_DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// Model aliases
const MODEL_ALIASES = {
  sonnet5: CLAUDE_SONNET_5,
  fennec: CLAUDE_SONNET_5,
  'claude-sonnet-5': CLAUDE_SONNET_5,
  'claude-sonnet-5-20260201': CLAUDE_SONNET_5,
};

export function normalizeClaudeModel(modelName) {
  if (!modelName) return CLAUDE_SONNET_5;
  return MODEL_ALIASES[modelName] || modelName;
}

// Pricing for Claude Sonnet 5 (per 1M tokens)
const SONNET_5_PRICING = {
  input: 3.0, // $3.00 per 1M input tokens
  output: 15.0, // $15.00 per 1M output tokens
};

/**
 * Check if Claude Sonnet 5 is available in the account
 */
export async function checkSonnet5Availability(apiKey) {
  const anthropic = new Anthropic({ apiKey });

  try {
    // Try to make a simple call with the Sonnet 5 model
    const message = await anthropic.messages.create({
      model: CLAUDE_SONNET_5,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test' }],
    });

    return {
      available: true,
      model: CLAUDE_SONNET_5,
      capabilities: message.usage
        ? ['high-context', 'improved-reasoning', 'better-code-generation']
        : [],
    };
  } catch (error) {
    // If it's an authentication or model access error, the model isn't available
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      return {
        available: false,
        model: CLAUDE_SONNET_5,
        error: error.message,
      };
    }

    // For other errors, re-throw
    throw error;
  }
}

/**
 * Get Claude model with Sonnet 5 support
 */
export function getClaudeModel(modelName, apiKey) {
  // Resolve alias if provided
  const resolvedModel = normalizeClaudeModel(modelName);

  // If requesting Sonnet 5 specifically, check availability
  if (resolvedModel === CLAUDE_SONNET_5) {
    printInfo(chalk.blue(`🔍 Checking Claude Sonnet 5 (${CLAUDE_SONNET_5}) availability...`));
  }

  return new Anthropic({ apiKey, model: resolvedModel });
}

/**
 * Get model pricing information
 */
export function getModelPricing(modelName) {
  const resolvedModel = MODEL_ALIASES[modelName] || modelName;

  if (resolvedModel === CLAUDE_SONNET_5) {
    return SONNET_5_PRICING;
  }

  // For other Claude models, return their respective pricing
  if (resolvedModel.includes('sonnet')) {
    return { input: 3.0, output: 15.0 }; // Sonnet family
  } else if (resolvedModel.includes('opus')) {
    return { input: 15.0, output: 75.0 }; // Opus family
  } else {
    return { input: 0.25, output: 1.25 }; // Haiku family
  }
}

/**
 * Auto-detect best available Claude model
 */
export async function detectBestClaudeModel(apiKey) {
  const anthropic = new Anthropic({ apiKey });

  // Check Sonnet 5 first
  try {
    await anthropic.messages.create({
      model: CLAUDE_SONNET_5,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Test' }],
    });

    printSuccess(chalk.green(`✅ Claude Sonnet 5 (${CLAUDE_SONNET_5}) is available`));
    return CLAUDE_SONNET_5;
  } catch (error) {
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      printWarning(chalk.yellow(`⚠️  Claude Sonnet 5 not available, falling back to default`));

      // Try Sonnet 3.5 next
      try {
        await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Test' }],
        });

        printInfo(chalk.blue(`✅ Defaulting to claude-3-5-sonnet-20241022`));
        return 'claude-3-5-sonnet-20241022';
      } catch {
        printError(chalk.red(`❌ No Claude models available`));
        throw new AppError('No Claude models available with provided API key', {
          code: 'MODEL_ACCESS_DENIED',
        });
      }
    }

    throw error;
  }
}

/**
 * Enhanced Claude provider with Sonnet 5 support
 */
export class ClaudeSonnet5Provider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = options.model || process.env.ULTRA_DEX_CLAUDE_MODEL || CLAUDE_SONNET_5;
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.3;

    if (!this.apiKey) {
      throw new AppError('ANTHROPIC_API_KEY is required for Claude provider', {
        code: 'MISSING_API_KEY',
      });
    }

    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  getName() {
    return 'Claude';
  }

  getModel() {
    return this.model;
  }

  async generate(systemPrompt, userPrompt, options = {}) {
    const resolvedModel = MODEL_ALIASES[this.model] || this.model;

    try {
      const message = await this.client.messages.create({
        model: resolvedModel,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      return {
        content: message.content[0]?.text || '',
        usage: {
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
          cacheCreationInputTokens: message.usage?.cache_creation_input_tokens || 0,
          cacheReadInputTokens: message.usage?.cache_read_input_tokens || 0,
        },
        model: message.model,
        finishReason: message.stop_reason,
      };
    } catch (error) {
      if (error.status === 401) {
        throw new AppError('Invalid Anthropic API key', { code: 'INVALID_API_KEY' });
      } else if (error.status === 403) {
        throw new AppError('Access denied to Claude model', { code: 'ACCESS_DENIED' });
      } else if (error.status === 404) {
        throw new AppError(`Claude model not found: ${resolvedModel}`, { code: 'MODEL_NOT_FOUND' });
      }
      throw error;
    }
  }

  async stream(systemPrompt, userPrompt, onToken, options = {}) {
    const resolvedModel = MODEL_ALIASES[this.model] || this.model;
    let fullResponse = '';
    let usage = { inputTokens: 0, outputTokens: 0 };

    try {
      const stream = await this.client.messages.stream({
        model: resolvedModel,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          fullResponse += chunk.delta.text;
          if (onToken) {
            onToken(chunk.delta.text);
          }
        } else if (chunk.type === 'message_stop') {
          // Capture usage at the end
          if (chunk.message?.usage) {
            usage = {
              inputTokens: chunk.message.usage.input_tokens || 0,
              outputTokens: chunk.message.usage.output_tokens || 0,
            };
          }
        }
      }

      return {
        content: fullResponse,
        usage,
        model: resolvedModel,
      };
    } catch (error) {
      if (fullResponse.length > 0) {
        return {
          content: fullResponse,
          usage,
          model: resolvedModel,
          partial: true,
          error,
        };
      }

      if (error.status === 401) {
        throw new AppError('Invalid Anthropic API key', { code: 'INVALID_API_KEY' });
      } else if (error.status === 403) {
        throw new AppError('Access denied to Claude model', { code: 'ACCESS_DENIED' });
      } else if (error.status === 404) {
        throw new AppError(`Claude model not found: ${resolvedModel}`, { code: 'MODEL_NOT_FOUND' });
      }
      throw error;
    }
  }

  async generateStream(systemPrompt, userPrompt, onToken, options = {}) {
    return this.stream(systemPrompt, userPrompt, onToken, options);
  }
}

export class ClaudeProvider extends ClaudeSonnet5Provider {
  constructor(apiKey, options = {}) {
    const envModel = options.model || process.env.ULTRA_DEX_CLAUDE_MODEL || CLAUDE_DEFAULT_MODEL;
    const normalized = normalizeClaudeModel(envModel);
    super({ ...options, apiKey, model: normalized });
    this.model = normalized;
    this.baseUrl = options.baseUrl || 'https://api.anthropic.com/v1';
    this.apiVersion = options.apiVersion || '2023-06-01';
  }

  getName() {
    return 'Claude (Anthropic)';
  }

  getDefaultModel() {
    return CLAUDE_DEFAULT_MODEL;
  }

  getAvailableModels() {
    return [
      { id: CLAUDE_DEFAULT_MODEL, name: 'Claude Sonnet 4', maxTokens: 200000 },
      { id: CLAUDE_SONNET_5, name: 'Claude Sonnet 5', maxTokens: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude Opus 3', maxTokens: 200000 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5', maxTokens: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3', maxTokens: 200000 },
    ];
  }

  estimateCost(inputTokens, outputTokens) {
    const model = this.model || CLAUDE_DEFAULT_MODEL;
    let pricing = { input: 3.0, output: 15.0 };

    if (model.includes('opus')) {
      pricing = { input: 15.0, output: 75.0 };
    } else if (model.includes('haiku')) {
      pricing = { input: 0.25, output: 1.25 };
    } else if (model.includes('sonnet')) {
      pricing = { input: 3.0, output: 15.0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      input: Number(inputCost.toFixed(6)),
      output: Number(outputCost.toFixed(6)),
      total: Number((inputCost + outputCost).toFixed(6)),
    };
  }
}

/**
 * Register Claude Sonnet 5 functionality with config manager
 */
export function registerClaudeSonnet5Config(configManager) {
  // Add Claude Sonnet 5 as default if available
  const defaultModel = process.env.ULTRA_DEX_CLAUDE_MODEL || CLAUDE_SONNET_5;

  configManager.define('ai.claude.model', {
    type: 'string',
    default: defaultModel,
    description: 'Claude model to use (supports aliases: sonnet5, fennec)',
    validate: (value) => {
      const resolvedModel = MODEL_ALIASES[value] || value;
      const validModels = [
        CLAUDE_SONNET_5,
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-5-sonnet-20240620',
        'claude-3-5-sonnet-20241022',
        'claude-3-haiku-20240307',
      ];
      return validModels.includes(resolvedModel);
    },
  });
}

export default {
  CLAUDE_SONNET_5,
  CLAUDE_DEFAULT_MODEL,
  MODEL_ALIASES,
  SONNET_5_PRICING,
  checkSonnet5Availability,
  getClaudeModel,
  getModelPricing,
  detectBestClaudeModel,
  ClaudeSonnet5Provider,
  ClaudeProvider,
  normalizeClaudeModel,
  registerClaudeSonnet5Config,
};
