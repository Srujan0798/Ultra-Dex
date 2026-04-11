/**
 * Cost Estimator
 *
 * Pre-flight cost estimation for AI provider calls.
 * Calculates expected cost based on token counts, provider pricing, and model selection.
 *
 * Pricing data sourced from provider public pricing (approximate, should be kept current).
 */

export interface ProviderPricing {
  name: string;
  inputCostPer1K: number;   // USD per 1K input tokens
  outputCostPer1K: number;  // USD per 1K output tokens
  models: Record<string, { inputCostPer1K: number; outputCostPer1K: number }>;
}

export interface CostEstimate {
  provider: string;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  costBreakdown: {
    inputCost: number;
    outputCost: number;
  };
  alternatives: Array<{
    provider: string;
    model: string;
    estimatedCostUsd: number;
    savings: number;
  }>;
}

export interface CostEstimateOptions {
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  taskComplexity?: 'simple' | 'moderate' | 'complex';
  maxCostUsd?: number;
}

// Default pricing (USD per 1K tokens) — approximate as of 2026
const DEFAULT_PRICING: ProviderPricing[] = [
  {
    name: 'claude',
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    models: {
      'claude-sonnet-4': { inputCostPer1K: 0.003, outputCostPer1K: 0.015 },
      'claude-opus-4': { inputCostPer1K: 0.015, outputCostPer1K: 0.075 },
      'claude-haiku': { inputCostPer1K: 0.00025, outputCostPer1K: 0.00125 },
    },
  },
  {
    name: 'openai',
    inputCostPer1K: 0.0025,
    outputCostPer1K: 0.01,
    models: {
      'gpt-4o': { inputCostPer1K: 0.0025, outputCostPer1K: 0.01 },
      'gpt-4o-mini': { inputCostPer1K: 0.00015, outputCostPer1K: 0.0006 },
      'o1': { inputCostPer1K: 0.015, outputCostPer1K: 0.06 },
    },
  },
  {
    name: 'gemini',
    inputCostPer1K: 0.00125,
    outputCostPer1K: 0.005,
    models: {
      'gemini-2.5-pro': { inputCostPer1K: 0.00125, outputCostPer1K: 0.01 },
      'gemini-2.5-flash': { inputCostPer1K: 0.0003, outputCostPer1K: 0.0025 },
    },
  },
  {
    name: 'nvidia',
    inputCostPer1K: 0.001,
    outputCostPer1K: 0.004,
    models: {
      'nemotron-4': { inputCostPer1K: 0.001, outputCostPer1K: 0.004 },
    },
  },
  {
    name: 'mistral',
    inputCostPer1K: 0.0002,
    outputCostPer1K: 0.0006,
    models: {
      'mistral-large': { inputCostPer1K: 0.002, outputCostPer1K: 0.006 },
      'mixtral': { inputCostPer1K: 0.0002, outputCostPer1K: 0.0006 },
    },
  },
  {
    name: 'groq',
    inputCostPer1K: 0.00027,
    outputCostPer1K: 0.00027,
    models: {
      'llama-3.1-70b': { inputCostPer1K: 0.00059, outputCostPer1K: 0.00079 },
      'mixtral-8x7b': { inputCostPer1K: 0.00027, outputCostPer1K: 0.00027 },
    },
  },
];

// Default token estimates by task complexity
const COMPLEXITY_TOKEN_ESTIMATES: Record<string, { input: number; output: number }> = {
  simple: { input: 500, output: 200 },
  moderate: { input: 2000, output: 800 },
  complex: { input: 8000, output: 3000 },
};

export class CostEstimator {
  private pricing: Map<string, ProviderPricing> = new Map();

  constructor(pricingConfigs: ProviderPricing[] = DEFAULT_PRICING) {
    for (const config of pricingConfigs) {
      this.pricing.set(config.name, config);
    }
  }

  /**
   * Add or update pricing for a provider.
   */
  setPricing(config: ProviderPricing): void {
    this.pricing.set(config.name, config);
  }

  /**
   * Get pricing for a provider.
   */
  getPricing(name: string): ProviderPricing | undefined {
    return this.pricing.get(name);
  }

  /**
   * Estimate cost for a task.
   *
   * If inputTokens/outputTokens not provided, estimates based on taskComplexity.
   * Returns cost estimate with alternatives sorted by savings.
   */
  estimate(options: CostEstimateOptions = {}): CostEstimate {
    const provider = options.provider || 'claude';
    const model = options.model || this._getDefaultModel(provider);

    // Determine token counts
    let inputTokens = options.inputTokens;
    let outputTokens = options.outputTokens;

    if (!inputTokens || !outputTokens) {
      const estimates = COMPLEXITY_TOKEN_ESTIMATES[options.taskComplexity || 'moderate'];
      inputTokens = inputTokens ?? estimates.input;
      outputTokens = outputTokens ?? estimates.output;
    }

    // Calculate cost
    const { inputCost, outputCost } = this._calculateCost(provider, model, inputTokens, outputTokens);
    const totalCost = inputCost + outputCost;

    // Find alternatives sorted by cost
    const alternatives = this._findAlternatives(provider, model, inputTokens, outputTokens, totalCost);

    return {
      provider,
      model,
      estimatedInputTokens: inputTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCostUsd: Math.round(totalCost * 10000) / 10000,
      costBreakdown: {
        inputCost: Math.round(inputCost * 10000) / 10000,
        outputCost: Math.round(outputCost * 10000) / 10000,
      },
      alternatives,
    };
  }

  /**
   * Find the cheapest provider for the given token counts.
   */
  findCheapest(inputTokens: number, outputTokens: number): { provider: string; model: string; cost: number } {
    let bestProvider = '';
    let bestModel = '';
    let bestCost = Infinity;

    for (const [name, pricing] of this.pricing) {
      const defaultModel = this._getDefaultModel(name);
      const modelPricing = pricing.models[defaultModel] || pricing;
      const cost = (inputTokens / 1000) * modelPricing.inputCostPer1K +
                   (outputTokens / 1000) * modelPricing.outputCostPer1K;
      if (cost < bestCost) {
        bestCost = cost;
        bestProvider = name;
        bestModel = defaultModel;
      }
    }

    return { provider: bestProvider, model: bestModel, cost: Math.round(bestCost * 10000) / 10000 };
  }

  /**
   * Check if a task fits within a budget.
   */
  fitsBudget(
    budgetUsd: number,
    options: CostEstimateOptions = {}
  ): { fits: boolean; estimatedCost: number; recommendedProvider?: string } {
    const estimate = this.estimate(options);

    if (estimate.estimatedCostUsd <= budgetUsd) {
      return { fits: true, estimatedCost: estimate.estimatedCostUsd };
    }

    // Find a cheaper alternative
    const cheapest = this.findCheapest(
      estimate.estimatedInputTokens,
      estimate.estimatedOutputTokens
    );

    if (cheapest.cost <= budgetUsd) {
      return {
        fits: true,
        estimatedCost: cheapest.cost,
        recommended_provider: `${cheapest.provider}/${cheapest.model}`,
      };
    }

    return { fits: false, estimatedCost: estimate.estimatedCostUsd };
  }

  /**
   * Get all provider pricing.
   */
  getAllPricing(): Record<string, ProviderPricing> {
    const result: Record<string, ProviderPricing> = {};
    for (const [name, pricing] of this.pricing) {
      result[name] = pricing;
    }
    return result;
  }

  // -----------------------------------------------------------------------
  // Private Methods
  // -----------------------------------------------------------------------

  private _getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      claude: 'claude-sonnet-4',
      openai: 'gpt-4o',
      gemini: 'gemini-2.5-flash',
      nvidia: 'nemotron-4',
      mistral: 'mixtral',
      groq: 'mixtral-8x7b',
    };
    return defaults[provider] || 'default';
  }

  private _calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): { inputCost: number; outputCost: number } {
    const pricing = this.pricing.get(provider);
    if (!pricing) {
      return { inputCost: 0, outputCost: 0 };
    }

    const modelPricing = pricing.models[model] || {
      inputCostPer1K: pricing.inputCostPer1K,
      outputCostPer1K: pricing.outputCostPer1K,
    };

    return {
      inputCost: (inputTokens / 1000) * modelPricing.inputCostPer1K,
      outputCost: (outputTokens / 1000) * modelPricing.outputCostPer1K,
    };
  }

  private _findAlternatives(
    currentProvider: string,
    currentModel: string,
    inputTokens: number,
    outputTokens: number,
    currentCost: number
  ): Array<{ provider: string; model: string; estimatedCostUsd: number; savings: number }> {
    const alternatives: Array<{ provider: string; model: string; estimatedCostUsd: number; savings: number }> = [];

    for (const [name, pricing] of this.pricing) {
      if (name === currentProvider) continue;

      const defaultModel = this._getDefaultModel(name);
      const modelPricing = pricing.models[defaultModel] || pricing;
      const cost = (inputTokens / 1000) * modelPricing.inputCostPer1K +
                   (outputTokens / 1000) * modelPricing.outputCostPer1K;

      alternatives.push({
        provider: name,
        model: defaultModel,
        estimatedCostUsd: Math.round(cost * 10000) / 10000,
        savings: Math.round((currentCost - cost) * 10000) / 10000,
      });
    }

    // Sort by savings (cheapest first)
    alternatives.sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);
    return alternatives.slice(0, 3); // Top 3 alternatives
  }
}

export const costEstimator = new CostEstimator();
