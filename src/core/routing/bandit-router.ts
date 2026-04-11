/**
 * Thompson Sampling Multi-Armed Bandit Router
 *
 * Implements Thompson Sampling (Beta-Bernoulli) for intelligent provider selection.
 * Balances exploration (trying less-used providers) vs exploitation (using known-good providers).
 *
 * Each provider has a Beta(α, β) distribution where:
 *   α = successes + 1 (prior)
 *   β = failures + 1 (prior)
 *
 * On each selection, sample from each provider's Beta distribution and pick the highest.
 * After execution, update α/β based on success/failure.
 *
 * Cost-aware: when costs are similar, prefer cheaper providers.
 */

import { ProviderStats } from './provider-stats.js';

export interface BanditProviderConfig {
  name: string;
  costPerToken?: number; // USD per token (for cost-aware routing)
  maxLatencyMs?: number; // SLA target
  weight?: number; // Manual override weight (0-1)
}

export interface BanditSelectionResult {
  provider: string;
  strategy: 'exploration' | 'exploitation' | 'cost-optimized' | 'manual';
  sampledScores: Record<string, number>;
}

export interface BanditUpdateOptions {
  success: boolean;
  latencyMs: number;
  costUsd: number;
  tokensUsed: number;
  model?: string;
}

export class ThompsonSamplingRouter {
  private providers: Map<string, ProviderStats> = new Map();
  private providerConfigs: Map<string, BanditProviderConfig> = new Map();

  // Beta distribution parameters per provider
  private alpha: Map<string, number> = new Map(); // successes + 1
  private beta: Map<string, number> = new Map();  // failures + 1

  // Exploration bonus decay
  private explorationDecay: number;
  private totalSelections: number = 0;

  constructor(
    configs: BanditProviderConfig[] = [],
    options: { explorationDecay?: number } = {}
  ) {
    this.explorationDecay = options.explorationDecay ?? 0.99;

    for (const config of configs) {
      this.addProvider(config);
    }

    // Default providers if none configured
    if (configs.length === 0) {
      this.addProvider({ name: 'claude' });
      this.addProvider({ name: 'openai' });
      this.addProvider({ name: 'gemini' });
      this.addProvider({ name: 'nvidia' });
    }
  }

  /**
   * Add a provider to the bandit.
   */
  addProvider(config: BanditProviderConfig): void {
    const stats = new ProviderStats(config.name);
    this.providers.set(config.name, stats);
    this.providerConfigs.set(config.name, config);
    this.alpha.set(config.name, 1); // Prior: Beta(1, 1) = Uniform
    this.beta.set(config.name, 1);
  }

  /**
   * Remove a provider from the bandit.
   */
  removeProvider(name: string): void {
    this.providers.delete(name);
    this.providerConfigs.delete(name);
    this.alpha.delete(name);
    this.beta.delete(name);
  }

  /**
   * Select a provider using Thompson Sampling.
   * Returns the selected provider name and metadata.
   */
  selectProvider(task: any, constraints: any = {}): BanditSelectionResult {
    this.totalSelections++;

    // If a specific provider is requested via constraints, use it
    if (constraints.provider && this.providers.has(constraints.provider)) {
      return {
        provider: constraints.provider,
        strategy: 'manual',
        sampledScores: {},
      };
    }

    // If only one provider available, use it
    if (this.providers.size === 1) {
      const [onlyProvider] = this.providers.keys();
      return {
        provider: onlyProvider,
        strategy: 'exploitation',
        sampledScores: { [onlyProvider]: 1.0 },
      };
    }

    // Thompson Sampling: sample from each provider's Beta distribution
    const samples: Record<string, number> = {};
    for (const [name] of this.providers) {
      samples[name] = this._sampleBeta(name);
    }

    // Cost-aware adjustment: if costs are configured, adjust scores
    const costAdjusted = this._applyCostAdjustment(samples, constraints);

    // Pick the provider with the highest (adjusted) sample
    let bestProvider = '';
    let bestScore = -1;
    for (const [name, score] of Object.entries(costAdjusted)) {
      if (score > bestScore) {
        bestScore = score;
        bestProvider = name;
      }
    }

    // Determine strategy type
    const alphaVal = this.alpha.get(bestProvider) ?? 1;
    const betaVal = this.beta.get(bestProvider) ?? 1;
    const mean = alphaVal / (alphaVal + betaVal);
    const strategy = mean > 0.8 ? 'exploitation' : 'exploration';

    return {
      provider: bestProvider,
      strategy,
      sampledScores: samples,
    };
  }

  /**
   * Update provider statistics after execution.
   */
  updateStats(provider: string, options: BanditUpdateOptions): void {
    const stats = this.providers.get(provider);
    if (!stats) return;

    // Update the ProviderStats object
    stats.update({
      cost: options.costUsd,
      latency: options.latencyMs,
      model: options.model,
      baselineCost: options.costUsd * 1.5, // Assume 50% more expensive baseline
    });

    // Update Beta distribution parameters
    if (options.success) {
      const currentAlpha = this.alpha.get(provider) ?? 1;
      this.alpha.set(provider, currentAlpha + 1);
    } else {
      const currentBeta = this.beta.get(provider) ?? 1;
      this.beta.set(provider, currentBeta + 1);
    }

    // Decay exploration bonus over time
    this._decayExploration();
  }

  /**
   * Get the current estimated success rate for each provider.
   */
  getEstimatedSuccessRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    for (const [name] of this.providers) {
      const a = this.alpha.get(name) ?? 1;
      const b = this.beta.get(name) ?? 1;
      rates[name] = a / (a + b);
    }
    return rates;
  }

  /**
   * Get the number of times each provider has been selected.
   */
  getSelectionCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [name, stats] of this.providers) {
      counts[name] = stats.getTotalCalls();
    }
    return counts;
  }

  /**
   * Get full provider statistics.
   */
  getProviderStats(): Map<string, ProviderStats> {
    return this.providers;
  }

  /**
   * Get cost savings from bandit routing vs always using the most expensive provider.
   */
  getCostSavings(): number {
    let totalSavings = 0;
    for (const [, stats] of this.providers) {
      totalSavings += stats.getCostSavings();
    }
    return totalSavings;
  }

  /**
   * Get per-provider cost breakdown.
   */
  getProviderCostBreakdown(): Record<string, { total: number; byModel: Record<string, number> }> {
    const result: Record<string, { total: number; byModel: Record<string, number> }> = {};
    for (const [name, stats] of this.providers) {
      result[name] = {
        total: stats.getTotalCost(),
        byModel: stats.getProviderCostBreakdown(),
      };
    }
    return result;
  }

  /**
   * Reset all provider statistics (keeps configs).
   */
  reset(): void {
    for (const [name] of this.providers) {
      this.alpha.set(name, 1);
      this.beta.set(name, 1);
    }
  }

  // -----------------------------------------------------------------------
  // Private Methods
  // -----------------------------------------------------------------------

  /**
   * Sample from a Beta distribution using the Gamma method.
   * Beta(α, β) = Gamma(α, 1) / (Gamma(α, 1) + Gamma(β, 1))
   */
  private _sampleBeta(provider: string): number {
    const alpha = this.alpha.get(provider) ?? 1;
    const beta = this.beta.get(provider) ?? 1;

    const x = this._sampleGamma(alpha);
    const y = this._sampleGamma(beta);

    if (x + y === 0) return 0.5; // Avoid division by zero
    return x / (x + y);
  }

  /**
   * Sample from a Gamma distribution using Marsaglia and Tsang's method.
   * For shape < 1, uses the transformation: Gamma(shape) = Gamma(shape+1) * U^(1/shape)
   */
  private _sampleGamma(shape: number): number {
    if (shape < 1) {
      return this._sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;
      do {
        x = this._normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * (x * x) * (x * x)) {
        return d * v;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  /**
   * Standard normal random number (Box-Muller transform).
   */
  private _normalRandom(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Apply cost-awareness to Thompson Sampling scores.
   * When providers have similar estimated success rates, prefer cheaper ones.
   */
  private _applyCostAdjustment(
    samples: Record<string, number>,
    constraints: any
  ): Record<string, number> {
    const adjusted = { ...samples };

    // If cost constraint is set, filter out expensive providers
    if (constraints.maxCostUsd) {
      for (const [name] of this.providers) {
        const config = this.providerConfigs.get(name);
        if (config?.costPerToken && constraints.estimatedTokens) {
          const estimatedCost = config.costPerToken * constraints.estimatedTokens;
          if (estimatedCost > constraints.maxCostUsd) {
            adjusted[name] = 0; // Disqualify
          }
        }
      }
    }

    // Cost bonus: slightly reduce score for expensive providers
    // This creates a soft preference for cheaper providers when scores are similar
    const costs: number[] = [];
    for (const [name] of this.providers) {
      const config = this.providerConfigs.get(name);
      costs.push(config?.costPerToken ?? 0);
    }
    const maxCost = Math.max(...costs, 1);

    for (const [name] of this.providers) {
      const config = this.providerConfigs.get(name);
      if (config?.costPerToken) {
        // Cost penalty: up to 10% reduction for most expensive provider
        const costRatio = config.costPerToken / maxCost;
        adjusted[name] *= (1 - 0.1 * costRatio);
      }
    }

    return adjusted;
  }

  /**
   * Decay exploration bonus over time to gradually shift toward exploitation.
   */
  private _decayExploration(): void {
    // Only decay after enough selections to avoid premature convergence
    if (this.totalSelections < 10) return;

    for (const [name] of this.providers) {
      const a = this.alpha.get(name) ?? 1;
      const b = this.beta.get(name) ?? 1;
      // Slowly pull toward prior (0.5) to maintain some exploration
      const decay = this.explorationDecay;
      this.alpha.set(name, a * decay + (1 - decay) * 0.5);
      this.beta.set(name, b * decay + (1 - decay) * 0.5);
    }
  }
}
