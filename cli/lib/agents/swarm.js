// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'events';

export class AgentSwarm extends EventEmitter {
  constructor(agents = []) {
    super();
    this.agents = agents;
    this.results = new Map();
    this.errors = [];
  }

  addAgent(agent) {
    this.agents.push(agent);
    return this;
  }

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

  async runCompetitive(task, selectBest) {
    const results = await this.runParallel(task);
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    );
    return selectBest(successful.map((r) => r.value));
  }
}

export default AgentSwarm;
