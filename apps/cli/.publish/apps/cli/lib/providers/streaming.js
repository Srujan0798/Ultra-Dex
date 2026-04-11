// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Streaming module
 * @module providers/streaming
 */

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '../utils/logger.js';

const PROVIDER_MAP = {
  openai: {
    create: (apiKey) => openai({ apiKey }),
    defaultModel: 'gpt-4o-mini',
  },
  claude: {
    create: (apiKey) => anthropic({ apiKey }),
    defaultModel: 'claude-3-5-sonnet-20240620',
  },
  anthropic: {
    create: (apiKey) => anthropic({ apiKey }),
    defaultModel: 'claude-3-5-sonnet-20240620',
  },
  google: {
    create: (apiKey) => createGoogleGenerativeAI({ apiKey }),
    defaultModel: 'gemini-1.5-pro',
  },
  gemini: {
    create: (apiKey) => createGoogleGenerativeAI({ apiKey }),
    defaultModel: 'gemini-1.5-pro',
  },
};

function resolveProvider(providerId) {
  const normalized = (providerId || '').toLowerCase();
  return PROVIDER_MAP[normalized] || null;
}

function resolveApiKey(providerId, apiKey) {
  if (apiKey) return apiKey;
  if (providerId === 'openai') return process.env.OPENAI_API_KEY;
  if (providerId === 'claude' || providerId === 'anthropic') return process.env.ANTHROPIC_API_KEY;
  if (providerId === 'google' || providerId === 'gemini') {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  }
  return null;
}

export async function streamWithProvider({
  providerId,
  model,
  systemPrompt,
  prompt,
  apiKey,
  onToken,
} = {}) {
  const provider = resolveProvider(providerId);
  if (!provider) {
    throw new Error(`Streaming provider not supported: ${providerId}`);
  }

  const resolvedKey = resolveApiKey(providerId, apiKey);
  if (!resolvedKey) {
    throw new Error(`Missing API key for ${providerId}. Set env var or pass --key.`);
  }

  const modelName = model || provider.defaultModel;
  const resolvedModelName =
    providerId === 'claude' || providerId === 'anthropic'
      ? normalizeClaudeModel(modelName)
      : modelName;
  const modelClient = provider.create(resolvedKey)(resolvedModelName);

  const response = await streamText({
    model: modelClient,
    system: systemPrompt,
    prompt,
  });

  let output = '';
  try {
    for await (const chunk of response.textStream) {
      output += chunk;
      if (onToken) onToken(chunk);
    }
  } catch (error) {
    if (output.length > 0) {
      // Return partial result
      return {
        text: output,
        usage: response.usage ?? null,
        model: modelName,
        partial: true,
        error,
      };
    }
    throw error;
  }

  const usage = response.usage ?? null;
  return { text: output, usage, model: modelName };
}

export function getStreamingProviders() {
  return Object.keys(PROVIDER_MAP);
}

function normalizeClaudeModel(model) {
  if (!model) return 'claude-3-5-sonnet-20240620';
  if (model === 'sonnet') return 'claude-3-5-sonnet-20240620';
  if (model === 'opus') return 'claude-3-opus-20240229';
  if (model === 'haiku') return 'claude-3-haiku-20240307';
  return model;
}

/**
 * Safe execution wrapper with error handling for streaming
 * @param {Function} fn - Async function to execute
 * @param {string} [context='streaming'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'streaming') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('providers.streaming.safe_execute_failed', {
      run_id: process.env.ULTRA_DEX_RUN_ID,
      module: 'providers.streaming',
      context,
      detail: message,
    });
    return null;
  }
}
