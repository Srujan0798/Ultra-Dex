import { EventEmitter } from 'events';

interface ProviderCostEntry {
  totalCost: number;
  callCount: number;
  avgLatency: number;
}

export class ProviderStats extends EventEmitter {
  private provider: string;
  private successRate: number = 1.0;
  private totalCalls: number = 0;
  private totalCost: number = 0;
  private avgLatency: number = 0;
  private costByModel: Map<string, number> = new Map();
  private baselineCost: number = 0; // What it would have cost with most expensive option

  constructor(provider: string) {
    super();
    this.provider = provider;
  }

  update(result: any): void {
    // Update statistics based on result
    this.totalCalls++;
    this.totalCost += result.cost || 0;
    this.avgLatency = (this.avgLatency * (this.totalCalls - 1) + result.latency) / this.totalCalls;

    // Track cost by model
    if (result.model && result.cost) {
      const existing = this.costByModel.get(result.model) || 0;
      this.costByModel.set(result.model, existing + result.cost);
    }

    // Track baseline cost (most expensive option)
    if (result.baselineCost) {
      this.baselineCost += result.baselineCost;
    }
  }

  getSuccessRate(): number {
    return this.successRate;
  }

  getTotalCalls(): number {
    return this.totalCalls;
  }

  getAverageLatency(): number {
    return this.avgLatency;
  }

  /**
   * Calculate how much was saved by using smart routing vs always using the most expensive option.
   * Returns the cumulative savings in USD.
   */
  getCostSavings(): number {
    return Math.max(0, this.baselineCost - this.totalCost);
  }

  /**
   * Get per-model cost breakdown for this provider.
   * Returns a record of model -> total cost.
   */
  getProviderCostBreakdown(): Record<string, number> {
    const result: Record<string, number> = {};
    this.costByModel.forEach((cost, model) => {
      result[model] = Math.round(cost * 10000) / 10000;
    });
    return result;
  }

  /**
   * Get total cost for this provider.
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * Get average cost per call for this provider.
   */
  getAvgCostPerCall(): number {
    return this.totalCalls > 0 ? this.totalCost / this.totalCalls : 0;
  }
}
