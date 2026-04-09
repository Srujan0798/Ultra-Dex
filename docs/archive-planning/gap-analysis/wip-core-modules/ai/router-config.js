// Copyright (c) 2026 Ultra-Dex

/**
 * Smart AI Router Configuration
 * - Provider priorities by strategy
 * - Model-to-provider mapping
 * - Cost table (USD per 1M tokens)
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

export const STRATEGY_PROVIDER_PRIORITIES = {
  cost: [
    'deepseek',
    'groq',
    'together',
    'qwen',
    'google',
    'cohere',
    'mistral',
    'openai',
    'anthropic',
    'kimi',
  ],
  latency: [
    'groq',
    'openai',
    'google',
    'mistral',
    'together',
    'cohere',
    'deepseek',
    'qwen',
    'anthropic',
    'kimi',
  ],
  quality: [
    'anthropic',
    'openai',
    'google',
    'mistral',
    'cohere',
    'deepseek',
    'qwen',
    'together',
    'groq',
    'kimi',
  ],
  fallback: [
    'openai',
    'anthropic',
    'google',
    'mistral',
    'cohere',
    'deepseek',
    'groq',
    'together',
    'qwen',
    'kimi',
  ],
};

// Updated provider priority configuration
export const PROVIDER_PRIORITY_CONFIG = {
  openai: { cost: 8, latency: 2, quality: 2, fallback: 1 },
  anthropic: { cost: 9, latency: 9, quality: 1, fallback: 2 },
  google: { cost: 3, latency: 3, quality: 3, fallback: 3 },
  mistral: { cost: 6, latency: 5, quality: 5, fallback: 4 },
  groq: { cost: 1, latency: 1, quality: 7, fallback: 5 },
  deepseek: { cost: 2, latency: 7, quality: 6, fallback: 6 },
  kimi: { cost: 5, latency: 8, quality: 8, fallback: 7 },
  qwen: { cost: 4, latency: 6, quality: 9, fallback: 8 },
  cohere: { cost: 7, latency: 4, quality: 4, fallback: 9 },
  together: { cost: 5, latency: 6, quality: 6, fallback: 10 },
  zhipu: { cost: 3, latency: 7, quality: 7, fallback: 11 },
  yi: { cost: 4, latency: 5, quality: 5, fallback: 12 },
  llama: { cost: 1, latency: 1, quality: 8, fallback: 13 },
  openclaw: { cost: 6, latency: 8, quality: 6, fallback: 14 },
};

export const MODEL_PROVIDER_MAP = {
  // OpenAI
  'gpt-4o': 'openai',
  'gpt-4.1': 'openai',
  o3: 'openai',
  'gpt-4o-mini': 'openai',

  // Anthropic
  'claude-opus-4-0': 'anthropic',
  'claude-sonnet-4-0': 'anthropic',
  'claude-3-5-sonnet-latest': 'anthropic',

  // Google
  'gemini-2.5-pro': 'google',
  'gemini-2.5-flash': 'google',
  'gemini-2.0-flash-exp': 'google',

  // Mistral
  'mistral-large-latest': 'mistral',
  'mistral-medium-latest': 'mistral',
  codestral: 'mistral',

  // Groq
  'llama-3.3-70b-versatile': 'groq',
  'mixtral-8x7b-32768': 'groq',

  // DeepSeek
  'deepseek-chat': 'deepseek',
  'deepseek-v3': 'deepseek',
  'deepseek-r1': 'deepseek',

  // Kimi / Moonshot
  'moonshot-v1-128k': 'kimi',

  // Qwen
  'qwen-plus': 'qwen',
  qwen3: 'qwen',

  // Cohere
  'command-r-plus': 'cohere',

  // Together
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': 'together',

  // Additional providers already present in repo
  'glm-4': 'zhipu',
  'yi-large': 'yi',
  'llama3.2': 'llama',
  'openclaw-vision': 'openclaw',
};

export const PROVIDER_COST_TABLE = {
  openai: { input: 2.5, output: 10.0 },
  anthropic: { input: 3.0, output: 15.0 },
  google: { input: 1.25, output: 5.0 },
  mistral: { input: 2.0, output: 6.0 },
  groq: { input: 0.59, output: 0.79 },
  deepseek: { input: 0.55, output: 2.19 },
  kimi: { input: 1.0, output: 4.0 },
  qwen: { input: 0.8, output: 2.0 },
  cohere: { input: 3.0, output: 15.0 },
  together: { input: 0.88, output: 0.88 },
  zhipu: { input: 0.5, output: 1.5 },
  yi: { input: 0.8, output: 2.4 },
  llama: { input: 0.0, output: 0.0 },
  openclaw: { input: 2.0, output: 8.0 },
};

const DEFAULT_ROUTER_CONFIG = {
  strategies: {
    cost: {
      providerPriority: STRATEGY_PROVIDER_PRIORITIES.cost,
      preferLowCost: true,
    },
    latency: {
      providerPriority: STRATEGY_PROVIDER_PRIORITIES.latency,
      preferLowLatency: true,
    },
    quality: {
      providerPriority: STRATEGY_PROVIDER_PRIORITIES.quality,
      preferHighQuality: true,
    },
    fallback: {
      providerPriority: STRATEGY_PROVIDER_PRIORITIES.fallback,
      enableFailover: true,
    },
  },
  modelToProvider: MODEL_PROVIDER_MAP,
  costTable: PROVIDER_COST_TABLE,
  overrides: [],
};

const CONFIG_LOCATIONS = [
  path.join(process.cwd(), '.ultra-dex', 'router.json'),
  path.join(process.cwd(), '.ultra', 'router.json'),
  path.join(process.cwd(), 'config', 'router.json'),
];

async function readConfigFile(filePath) {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadRouterConfig() {
  for (const configPath of CONFIG_LOCATIONS) {
    const data = await readConfigFile(configPath);
    if (data) return mergeConfig(data);
  }
  return mergeConfig({});
}

export function loadRouterConfigSync() {
  for (const configPath of CONFIG_LOCATIONS) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(raw);
      return mergeConfig(data);
    } catch {
      // continue
    }
  }
  return mergeConfig({});
}

export function mergeConfig(config = {}) {
  return {
    strategies: {
      ...DEFAULT_ROUTER_CONFIG.strategies,
      ...(config.strategies || {}),
    },
    modelToProvider: {
      ...DEFAULT_ROUTER_CONFIG.modelToProvider,
      ...(config.modelToProvider || {}),
    },
    costTable: {
      ...DEFAULT_ROUTER_CONFIG.costTable,
      ...(config.costTable || {}),
    },
    overrides: Array.isArray(config.overrides) ? config.overrides : DEFAULT_ROUTER_CONFIG.overrides,
  };
}

export function resolveOverrides(taskDescription, overrides = []) {
  if (!taskDescription) return null;
  const lower = taskDescription.toLowerCase();
  return overrides.find(
    (rule) => rule.keyword && lower.includes(String(rule.keyword).toLowerCase())
  );
}

export default {
  DEFAULT_ROUTER_CONFIG,
  STRATEGY_PROVIDER_PRIORITIES,
  MODEL_PROVIDER_MAP,
  PROVIDER_COST_TABLE,
  loadRouterConfig,
  loadRouterConfigSync,
  mergeConfig,
  resolveOverrides,
};
