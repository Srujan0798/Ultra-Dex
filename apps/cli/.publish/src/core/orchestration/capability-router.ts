var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import logger from '../../services/logging/structured-logger.js';
let CapabilityRouter = class {
  constructor(agentRegistry, options = {}) {
    this.registry = agentRegistry;
    this.options = {
      enableCaching: options.enableCaching !== false,
      cacheTtlMs: options.cacheTtlMs || 5 * 60 * 1e3,
      // 5 minutes
      enableLogging: options.enableLogging !== false,
      ...options,
    };
    this.routeCache = /* @__PURE__ */ new Map();
    this.defaultCapabilities = {
      orchestrator: ['coordination', 'planning', 'general'],
      cto: ['architecture', 'planning', 'technology-selection', 'system-design'],
      planner: ['planning', 'task-breakdown', 'estimation', 'project-management'],
      research: ['research', 'evaluation', 'comparison', 'analysis'],
      backend: ['nodejs', 'api', 'server', 'implementation', 'coding', 'api-design'],
      database: ['database', 'sql', 'schema-design', 'query-optimization', 'data-modeling'],
      frontend: [
        'ui',
        'component',
        'javascript',
        'css',
        'html',
        'implementation',
        'coding',
        'ui-design',
      ],
      auth: ['authentication', 'authorization', 'security', 'user-management', 'permissions'],
      security: ['security', 'audit', 'vulnerability-assessment', 'compliance', 'encryption'],
      devops: ['deployment', 'infrastructure', 'ci-cd', 'docker', 'kubernetes', 'monitoring'],
      debugger: ['debugging', 'troubleshooting', 'analysis', 'problem-solving'],
      documentation: ['technical-writing', 'documentation', 'api-docs', 'guides'],
      reviewer: ['code-review', 'quality-assurance', 'standards', 'best-practices'],
      testing: ['testing', 'qa', 'automation', 'coverage', 'validation'],
      performance: ['optimization', 'performance', 'profiling', 'scalability', 'monitoring'],
      refactoring: ['refactoring', 'code-quality', 'design-patterns', 'maintainability'],
    };
    this.logger = this.options.enableLogging
      ? logger.child({ component: 'CapabilityRouter' })
      : null;
  }
  /**
   * Route a task to an agent based on required capabilities
   * @param {Object} request - Routing request
   * @param {string} request.task - Task description
   * @param {string[]} request.required - Required capabilities
   * @param {Object} options - Additional routing options
   * @returns {Object} - { agent: agentId, capabilities: matchedCapabilities }
   * @throws {Error} - If no agent matches the required capabilities
   */
  async route({ task, required }, options = {}) {
    if (!required || !Array.isArray(required) || required.length === 0) {
      throw new Error('CapabilityRouter: "required" must be a non-empty array of capabilities');
    }
    const correlationId =
      options.correlationId || `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.logger) {
      this.logger.info('Routing task to agent', {
        task: task.substring(0, 100),
        required,
        correlationId,
      });
    }
    if (this.options.enableCaching) {
      const cacheKey = this.getCacheKey(required);
      const cached = this.getCachedRoute(cacheKey);
      if (cached) {
        if (this.logger) {
          this.logger.debug('Using cached routing decision', {
            cacheKey,
            agent: cached.agent,
            correlationId,
          });
        }
        return cached;
      }
    }
    const matchingAgents = this.registry.findAgentsByCapabilities(required);
    if (matchingAgents.length === 0) {
      const error = new Error(`No agent found with required capabilities: ${required.join(', ')}`);
      if (this.logger) {
        this.logger.error('No matching agent found', {
          task: task.substring(0, 100),
          required,
          availableAgents: this.registry
            .getAllAgents()
            .map((a) => ({ id: a.id, capabilities: a.capabilities })),
          correlationId,
        });
      }
      throw error;
    }
    const selectedAgent = this.selectBestAgent(matchingAgents, required);
    const result = {
      agent: selectedAgent.id,
      capabilities: selectedAgent.capabilities,
      matchedCapabilities: this.getMatchedCapabilities(selectedAgent.capabilities, required),
    };
    if (this.options.enableCaching) {
      const cacheKey = this.getCacheKey(required);
      this.setCachedRoute(cacheKey, result);
    }
    if (this.logger) {
      this.logger.info('Successfully routed task to agent', {
        task: task.substring(0, 100),
        required,
        selectedAgent: selectedAgent.id,
        matchedCapabilities: result.matchedCapabilities,
        correlationId,
      });
    }
    return result;
  }
  /**
   * Get matched capabilities between agent and required
   */
  getMatchedCapabilities(agentCapabilities, requiredCapabilities) {
    return requiredCapabilities.filter((cap) => agentCapabilities.includes(cap));
  }
  /**
   * Select the best agent from candidates (simple implementation)
   * Could be enhanced with scoring based on agent performance, load, etc.
   */
  selectBestAgent(agents, requiredCapabilities) {
    return agents.reduce((best, current) => {
      const bestMatches = this.getMatchedCapabilities(
        best.capabilities,
        requiredCapabilities
      ).length;
      const currentMatches = this.getMatchedCapabilities(
        current.capabilities,
        requiredCapabilities
      ).length;
      return currentMatches > bestMatches ? current : best;
    });
  }
  /**
   * Get cache key for routing decision
   */
  getCacheKey(requiredCapabilities) {
    return requiredCapabilities.sort().join(',');
  }
  /**
   * Get cached routing decision
   */
  getCachedRoute(cacheKey) {
    const cached = this.routeCache.get(cacheKey);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.options.cacheTtlMs) {
      this.routeCache.delete(cacheKey);
      return null;
    }
    return cached.result;
  }
  /**
   * Set cached routing decision
   */
  setCachedRoute(cacheKey, result) {
    this.routeCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
  }
  /**
   * Clear routing cache
   */
  clearCache() {
    this.routeCache.clear();
    if (this.logger) {
      this.logger.info('Routing cache cleared');
    }
  }
  /**
   * Get routing statistics
   */
  getStats() {
    return {
      cacheSize: this.routeCache.size,
      cacheEnabled: this.options.enableCaching,
      cacheTtlMs: this.options.cacheTtlMs,
      totalAgents: this.registry.getAllAgents().length,
    };
  }
  /**
   * Validate that an agent has the required capabilities
   * @param {string} agentId - Agent ID to validate
   * @param {string[]} requiredCapabilities - Required capabilities
   * @returns {boolean} - Whether the agent has all required capabilities
   */
  validateAgentCapabilities(agentId, requiredCapabilities) {
    const agent = this.registry.getAgentById(agentId);
    if (!agent) return false;
    return requiredCapabilities.every((cap) => agent.capabilities.includes(cap));
  }
  /**
   * Get all agents that have specific capabilities
   * @param {string[]} capabilities - Capabilities to search for
   * @returns {Array} - Array of agent objects
   */
  getAgentsWithCapabilities(capabilities) {
    return this.registry.findAgentsByCapabilities(capabilities);
  }
  /**
   * Get default capabilities for an agent type
   * @param {string} agentType - Agent type (e.g., 'backend', 'frontend')
   * @returns {string[]} - Default capabilities for the agent type
   */
  getDefaultCapabilities(agentType) {
    return this.defaultCapabilities[agentType] || [];
  }
  /**
   * Register default capabilities for a new agent type
   * @param {string} agentType - Agent type
   * @param {string[]} capabilities - Capabilities for this agent type
   */
  registerAgentTypeCapabilities(agentType, capabilities) {
    this.defaultCapabilities[agentType] = capabilities;
    if (this.logger) {
      this.logger.info('Registered capabilities for agent type', {
        agentType,
        capabilities,
      });
    }
  }
};
CapabilityRouter = __decorateClass([singleton()], CapabilityRouter);
var capability_router_default = CapabilityRouter;
export { CapabilityRouter, capability_router_default as default };
