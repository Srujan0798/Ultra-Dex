// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'events';

/**
 * Swarm orchestrator for running multiple agents in parallel, sequential, waterfall, or competitive modes
 * @extends EventEmitter
 */
export class AgentSwarm extends EventEmitter {
  /**
   * Create a new agent swarm
   * @param {Array<import('./base-agent.js').BaseAgent>} [agents=[]] - Initial agents
   */
  constructor(agents = []) {
    super();
    this.agents = agents;
    this.results = new Map();
    this.errors = [];
  }

  /**
   * Add an agent to the swarm
   * @param {import('./base-agent.js').BaseAgent} agent - Agent to add
   * @returns {AgentSwarm} this (for chaining)
   */
  addAgent(agent) {
    this.agents.push(agent);
    return this;
  }

  /**
   * Run all agents in parallel on the same task
   * @param {Object} task - Task to execute
   * @returns {Promise<Array<PromiseSettledResult>>} Settled results
   */
  async runParallel(task) {
    this.emit('start', { mode: 'parallel', agentCount: this.agents.length });

    const promises = this.agents.map(async (agent) => {
      try {
        const result = await agent.execute(task);
        this.results.set(agent.name, result);
        this.emit('agentComplete', { agent: agent.name, result });
        return { agent: agent.name, success: true, result };
      } catch (error) {
        this.errors.push({ agent: agent.name, error });
        this.emit('agentError', { agent: agent.name, error });
        return { agent: agent.name, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(promises);
    this.emit('complete', { results: this.results, errors: this.errors });
    return results;
  }

  /**
   * Run agents sequentially, stopping on error or shouldStop signal
   * @param {Object} task - Task to execute
   * @returns {Promise<Array<Object>>} Ordered results
   */
  async runSequential(task) {
    this.emit('start', { mode: 'sequential', agentCount: this.agents.length });
    const results = [];

    for (const agent of this.agents) {
      try {
        const result = await agent.execute(task);
        results.push({ agent: agent.name, success: true, result });
        this.emit('agentComplete', { agent: agent.name, result });

        if (result?.shouldStop) {
          this.emit('stopped', { agent: agent.name, reason: result.stopReason });
          break;
        }
      } catch (error) {
        results.push({ agent: agent.name, success: false, error: error.message });
        this.emit('agentError', { agent: agent.name, error });
        break;
      }
    }

    return results;
  }

  /**
   * Run agents in waterfall mode — each agent receives previous output as input
   * @param {*} initialContext - Initial context passed to the first agent
   * @returns {Promise<*>} Final context after all agents
   * @throws {Error} If any agent fails
   */
  async runWaterfall(initialContext) {
    this.emit('start', { mode: 'waterfall', agentCount: this.agents.length });
    let context = initialContext;

    for (const agent of this.agents) {
      try {
        context = await agent.execute(context);
        this.emit('agentComplete', { agent: agent.name, context });
      } catch (error) {
        this.emit('agentError', { agent: agent.name, error });
        throw error;
      }
    }

    return context;
  }

  /**
   * Run agents competitively and select the best result
   * @param {Object} task - Task to execute
   * @param {Function} selectBest - Selector function to pick the best result
   * @returns {Promise<*>} Best result as chosen by selectBest
   */
  async runCompetitive(task, selectBest) {
    const results = await this.runParallel(task);
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    );
    return selectBest(successful.map((r) => r.value));
  }
}

export default AgentSwarm;
