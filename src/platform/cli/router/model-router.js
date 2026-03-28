// Copyright (c) 2026 Ultra-Dex

/**
 * Smart Model Router
 * Task-based routing with cost optimization, fallback chains, health checks, and usage forecasts.
 */

import { estimateTokens, forecastCost } from '../utils/token-forecast.js';
import { monitoring } from '../utils/monitoring.js';
import { CostOptimizer } from './cost-optimizer.js';
import { loadBenchmarks, selectBestModel } from './benchmarks.js';

const FALLBACK_CHAIN = ['claude', 'openai', 'gemini'];

const MODEL_MAP = {
  claude: {
    fast: 'claude-haiku-20240307',
    balanced: 'claude-sonnet-4-20250514',
    powerful: 'claude-opus-20240229',
  },
  openai: {
    fast: 'gpt-3.5-turbo',
    balanced: 'gpt-4-turbo',
    powerful: 'gpt-4',
  },
  gemini: {
    fast: 'gemini-pro',
    balanced: 'gemini-pro',
    powerful: 'gemini-1.5-pro',
  },
};

const COMPLEXITY_KEYWORDS = {
  complex: [
    'architecture',
    'refactor',
    'migration',
    'performance',
    'security audit',
    'distributed',
    'multi-agent',
  ],
  medium: ['feature', 'endpoint', 'integration', 'optimize', 'module', 'component'],
  simple: ['typo', 'docs', 'readme', 'rename', 'format', 'comment'],
};

function classifyTask(task = '') {
  const lower = task.toLowerCase();
  const score = { simple: 0, medium: 0, complex: 0 };

  Object.entries(COMPLEXITY_KEYWORDS).forEach(([level, keywords]) => {
    keywords.forEach((keyword) => {
      if (lower.includes(keyword)) score[level] += 1;
    });
  });

  let level = 'medium';
  if (score.complex > score.medium && score.complex > score.simple) level = 'complex';
  if (score.simple > score.medium && score.simple >= score.complex) level = 'simple';

  return { level, score };
}

function mapForecastModel(model) {
  if (model.startsWith('claude-opus')) return 'claude-3-opus';
  if (model.startsWith('claude-sonnet')) return 'claude-3-sonnet';
  if (model.startsWith('claude-haiku')) return 'claude-3-haiku';
  if (model.startsWith('gemini-1.5')) return 'gemini-1.5-pro';
  return model;
}

function getProviderHealth() {
  const health = {
    claude: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GOOGLE_AI_KEY,
  };
  return health;
}

export class SmartModelRouter {
  constructor(options = {}) {
    this.fallbackChain = options.fallbackChain || FALLBACK_CHAIN;
    this.costBias = options.costBias || 0.5; // 0 = quality, 1 = cost
    this.optimizer = new CostOptimizer({ budget: options.budget });
  }

  selectProvider(preferred, health) {
    const chain = preferred
      ? [preferred, ...this.fallbackChain.filter((p) => p !== preferred)]
      : this.fallbackChain;
    for (const provider of chain) {
      if (health[provider]) return provider;
    }
    return chain[0];
  }

  selectModel(provider, tier, options = {}) {
    const map = MODEL_MAP[provider] || MODEL_MAP.claude;
    if (options.costSensitive) return map.fast;
    if (tier === 'complex') return map.powerful;
    if (tier === 'simple') return map.fast;
    return map.balanced;
  }

  forecastUsage(task, model) {
    const inputTokens = estimateTokens(task || '', 'plain');
    const estimatedOutputTokens = Math.max(512, Math.round(inputTokens * 0.6));
    return forecastCost(inputTokens, estimatedOutputTokens, mapForecastModel(model));
  }

  async routeTask(task, options = {}) {
    const classification = classifyTask(task || '');
    const health = getProviderHealth();
    const preferredProvider = options.preferredProvider;

    const provider = this.selectProvider(preferredProvider, health);
    let model = this.selectModel(provider, classification.level, options);

    if (options.useBenchmarks) {
      const benchmarks = await loadBenchmarks();
      const best = selectBestModel(
        benchmarks.records || [],
        options.taskType || classification.level
      );
      if (best?.model) model = best.model;
    }

    const forecast = this.forecastUsage(task, model);

    if (options.optimizeCost) {
      const downgrade = await this.optimizer.shouldDowngrade(forecast.totalCost || 0);
      if (downgrade) {
        model = this.selectModel(provider, 'simple', { costSensitive: true });
      }
    }

    monitoring.incrementCounter('router_requests');

    return {
      provider,
      model,
      classification,
      fallbackChain: this.fallbackChain,
      health,
      forecast,
    };
  }
}

export const modelRouter = new SmartModelRouter();

/**
 * Safe execution wrapper with error handling for model-router
 * @param {Function} fn - Async function to execute
 * @param {string} [context='model-router'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'model-router') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
