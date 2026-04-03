// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/scheduler.js

import { AgentRegistry } from './registry.js';
import TraceCollector from '../observability/trace-collector.js';

/**
 * Scheduler
 * Deterministically assigns task steps to agents based on capabilities
 */

export class Scheduler {
  constructor(agentRegistry, traceCollector, options = {}) {
    this.registry = agentRegistry;
    this.traceCollector = traceCollector;
    this.options = {
      enableLoadBalancing: options.enableLoadBalancing !== false,
      maxConcurrentTasksPerAgent: options.maxConcurrentTasksPerAgent || 5,
      ...options,
    };

    this.agentLoad = new Map(); // agentId -> current load count
    this.assignmentHistory = []; // For deterministic round-robin if needed
  }

  /**
   * Assign a step to an agent based on requirements
   * @param {Array<string>} requirements - Array of capability requirements (e.g., ["nodejs", "api"])
   * @param {Object} context - Additional context for assignment
   * @returns {Object} - Assigned agent info
   * @throws {Error} - If no agent matches the requirements
   */
  async assignStep(requirements, context = {}) {
    const traceId =
      context.traceId ||
      this.traceCollector?.startTrace({
        agentId: 'scheduler',
        task: `Assign step with requirements: ${requirements.join(', ')}`,
        metadata: { requirements, context },
      });

    const spanId = this.traceCollector?.startSpan({
      traceId,
      operation: 'agent_assignment',
      agentId: 'scheduler',
      metadata: { requirements, stepCount: context.stepCount },
    });

    try {
      // Find agents matching all requirements
      const matchingAgents = this.registry.findAgentsByCapabilities(requirements);

      if (matchingAgents.length === 0) {
        const error = new Error(
          `No agent found with required capabilities: ${requirements.join(', ')}`
        );
        this.traceCollector?.failSpan(traceId, spanId, error);
        throw error;
      }

      // Filter agents that are active
      const activeAgents = matchingAgents.filter((agent) => agent.status === 'active');

      if (activeAgents.length === 0) {
        const error = new Error(
          `No active agents found with required capabilities: ${requirements.join(', ')}`
        );
        this.traceCollector?.failSpan(traceId, spanId, error);
        throw error;
      }

      // Sort agents deterministically for consistent assignment
      const sortedAgents = activeAgents.sort((a, b) => a.id.localeCompare(b.id));

      // Apply load balancing if enabled
      let selectedAgent;
      if (this.options.enableLoadBalancing) {
        selectedAgent = this.selectLeastLoadedAgent(sortedAgents);
      } else {
        // Deterministic assignment: use hash of requirements for consistent selection
        const hash = this.hashRequirements(requirements);
        const index = hash % sortedAgents.length;
        selectedAgent = sortedAgents[index];
      }

      // Check agent availability
      const currentLoad = this.getAgentLoad(selectedAgent.id);
      if (currentLoad >= this.options.maxConcurrentTasksPerAgent) {
        const error = new Error(
          `Agent ${selectedAgent.id} is at maximum load (${currentLoad}/${this.options.maxConcurrentTasksPerAgent})`
        );
        this.traceCollector?.failSpan(traceId, spanId, error);
        throw error;
      }

      // Increment load
      this.incrementAgentLoad(selectedAgent.id);

      // Log assignment
      this.traceCollector?.addEvent(traceId, spanId, 'agent_assigned', {
        agentId: selectedAgent.id,
        requirements,
        loadAfter: this.getAgentLoad(selectedAgent.id),
      });

      this.traceCollector?.endSpan(traceId, spanId);

      return {
        agentId: selectedAgent.id,
        agent: selectedAgent,
        requirements,
        assignedAt: Date.now(),
        traceId,
      };
    } catch (error) {
      if (spanId) this.traceCollector?.failSpan(traceId, spanId, error);
      throw error;
    }
  }

  /**
   * Release load for an agent after task completion
   * @param {string} agentId - The agent ID
   */
  releaseAgentLoad(agentId) {
    this.decrementAgentLoad(agentId);
  }

  /**
   * Select the least loaded agent from candidates
   * @param {Array} agents - Array of agent objects
   * @returns {Object} - Selected agent
   */
  selectLeastLoadedAgent(agents) {
    let minLoad = Infinity;
    let selectedAgent = agents[0];

    for (const agent of agents) {
      const load = this.getAgentLoad(agent.id);
      if (load < minLoad) {
        minLoad = load;
        selectedAgent = agent;
      }
    }

    return selectedAgent;
  }

  /**
   * Get current load for an agent
   * @param {string} agentId - The agent ID
   * @returns {number} - Current load count
   */
  getAgentLoad(agentId) {
    return this.agentLoad.get(agentId) || 0;
  }

  /**
   * Increment agent load counter
   * @param {string} agentId - The agent ID
   */
  incrementAgentLoad(agentId) {
    const current = this.getAgentLoad(agentId);
    this.agentLoad.set(agentId, current + 1);
  }

  /**
   * Decrement agent load counter
   * @param {string} agentId - The agent ID
   */
  decrementAgentLoad(agentId) {
    const current = this.getAgentLoad(agentId);
    if (current > 0) {
      this.agentLoad.set(agentId, current - 1);
    } else {
      this.agentLoad.delete(agentId);
    }
  }

  /**
   * Generate a simple hash for deterministic selection
   * @param {Array<string>} requirements - Array of requirements
   * @returns {number} - Hash value
   */
  hashRequirements(requirements) {
    const str = requirements.sort().join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get scheduler metrics
   * @returns {Object} - Metrics object
   */
  getMetrics() {
    const totalLoad = Array.from(this.agentLoad.values()).reduce((sum, load) => sum + load, 0);
    const agentCount = this.agentLoad.size;

    return {
      totalAgentLoad: totalLoad,
      averageLoadPerAgent: agentCount > 0 ? totalLoad / agentCount : 0,
      agentLoads: Object.fromEntries(this.agentLoad.entries()),
      maxConcurrentTasksPerAgent: this.options.maxConcurrentTasksPerAgent,
    };
  }

  /**
   * Reset all agent loads (useful for testing or restarts)
   */
  resetLoads() {
    this.agentLoad.clear();
  }
}
