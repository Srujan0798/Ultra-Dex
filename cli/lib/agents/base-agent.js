// Copyright (c) 2026 Ultra-Dex

export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.metrics = { calls: 0, avgTime: 0, errors: 0 };
  }

  async healthCheck() {
    return { status: 'healthy', lastCheck: new Date() };
  }

  async execute(task) {
    const start = Date.now();
    this.metrics.calls += 1;

    try {
      const result = await this.run(task);
      this.metrics.avgTime = (this.metrics.avgTime + (Date.now() - start)) / 2;
      return result;
    } catch (error) {
      this.metrics.errors += 1;
      throw error;
    }
  }

  // Override in subclasses
  async run() {
    throw new Error('Not implemented');
  }

  getMetrics() {
    return this.metrics;
  }
}

export default BaseAgent;
