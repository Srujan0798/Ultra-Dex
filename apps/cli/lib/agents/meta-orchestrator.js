// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Meta Orchestrator module
 * @module agents/meta-orchestrator
 */

import AgentSwarm from './swarm.js';

export class MetaOrchestrator {
  constructor(agentRegistry) {
    this.registry = agentRegistry;
    this.history = [];
  }

  selectAgents(task) {
    const complexity = this.analyzeComplexity(task);
    const domain = this.classifyDomain(task);

    const agents = [];

    if (complexity > 0.7) {
      const planner = this.registry.get('planner');
      if (planner) agents.push(planner);
    }

    switch (domain) {
      case 'security':
        agents.push(this.registry.get('security-auditor'));
        agents.push(this.registry.get('pen-tester'));
        break;
      case 'development':
        agents.push(this.registry.get('builder'));
        agents.push(this.registry.get('debugger'));
        break;
      case 'review':
        agents.push(this.registry.get('code-reviewer'));
        agents.push(this.registry.get('quality'));
        break;
      default:
        break;
    }

    agents.push(this.registry.get('reviewer'));

    return agents.filter(Boolean);
  }

  analyzeComplexity(task) {
    const description = task?.description || '';
    const factors = {
      length: Math.min(description.length / 1000, 1),
      files: Math.min((task?.files || []).length / 10, 1),
      dependencies: Math.min((task?.dependencies || []).length / 5, 1),
    };

    return (factors.length + factors.files + factors.dependencies) / 3;
  }

  classifyDomain(task) {
    const keywords = (task?.description || '').toLowerCase();
    if (keywords.includes('security') || keywords.includes('auth')) return 'security';
    if (keywords.includes('review') || keywords.includes('audit')) return 'review';
    if (keywords.includes('build') || keywords.includes('implement')) return 'development';
    return 'general';
  }

  async coordinate(task) {
    const agents = this.selectAgents(task);
    const swarm = new AgentSwarm(agents);

    this.history.push({
      task: task?.id,
      agents: agents.map((agent) => agent.name),
      startTime: new Date(),
    });

    return swarm.runWaterfall(task);
  }
}

export default MetaOrchestrator;

/**
 * Safe execution wrapper with error handling for meta-orchestrator
 * @param {Function} fn - Async function to execute
 * @param {string} [context='meta-orchestrator'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'meta-orchestrator') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
