/**
 * Cost Optimizer for model routing
 */

import fs from 'fs/promises';
import path from 'path';

const USAGE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'router-usage.json');

export class CostOptimizer {
  constructor(options = {}) {
    this.budget = options.budget || { daily: 10, monthly: 200 };
  }

  async loadUsage() {
    try {
      const content = await fs.readFile(USAGE_PATH, 'utf8');
      return JSON.parse(content);
    } catch {
      return { daily: 0, monthly: 0 };
    }
  }

  async recordUsage(cost) {
    const usage = await this.loadUsage();
    usage.daily += cost;
    usage.monthly += cost;
    await fs.mkdir(path.dirname(USAGE_PATH), { recursive: true });
    await fs.writeFile(USAGE_PATH, JSON.stringify(usage, null, 2));
  }

  async shouldDowngrade(costEstimate) {
    const usage = await this.loadUsage();
    if (this.budget.daily && usage.daily + costEstimate > this.budget.daily) return true;
    if (this.budget.monthly && usage.monthly + costEstimate > this.budget.monthly) return true;
    return false;
  }
}

export default CostOptimizer;
