// Copyright (c) 2026 Ultra-Dex

/**
 * Base class for all Ultra-Dex AI agents
 * Provides metrics tracking and a standard execute/run lifecycle
 */
export class BaseAgent {
  /**
   * Create a new agent
   * @param {string} name - Agent identifier
   * @param {Object} [config={}] - Agent configuration
   */
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.metrics = { calls: 0, avgTime: 0, errors: 0 };
  }

  /**
   * Check agent health status
   * @returns {Promise<{status: string, lastCheck: Date}>} Health status object
   */
  async healthCheck() {
    return { status: 'healthy', lastCheck: new Date() };
  }

  /**
   * Execute a task with metrics tracking
   * @param {Object} task - Task to execute
   * @returns {Promise<*>} Task result
   * @throws {Error} If run() fails
   */
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

  /**
   * Run the agent's core logic — must be overridden by subclasses
   * @param {Object} [_task] - Task to run
   * @returns {Promise<*>} Subclass-defined result
   * @throws {Error} Always throws if not overridden
   * @abstract
   */
  async run() {
    throw new Error('Not implemented');
  }

  /**
   * Get agent performance metrics
   * @returns {{calls: number, avgTime: number, errors: number}} Metrics object
   */
  getMetrics() {
    return this.metrics;
  }
}

export default BaseAgent;
