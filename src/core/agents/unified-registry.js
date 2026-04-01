/**
 * Unified Agent Registry
 * Merges legacy functional registry and enhanced class-based registry.
 */

import { EventEmitter } from 'events';

class UnifiedRegistry extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 100,
      ...config,
    };
    this.agents = new Map();
    this.initialized = false;
  }

  async initialize(initialAgents = []) {
    if (this.initialized) return true;

    // Register initial agents if provided
    for (const agent of initialAgents) {
      await this.register(agent);
    }

    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  /**
   * Register an agent
   * @param {Object} agent - Agent definition
   * @returns {Promise<Object>} Sanitized agent
   */
  async register(agent) {
    // Handle both 'id' and 'name' as identifiers for backward compatibility
    const agentId = agent.id || agent.name;
    
    if (!agentId) {
      throw new Error('Agent id or name is required');
    }

    if (this.agents.size >= this.config.maxAgents && !this.agents.has(agentId)) {
      throw new Error('Agent registry is full');
    }

    const normalized = {
      id: agentId,
      name: agent.name || agentId,
      capabilities: agent.capabilities || [],
      description: agent.description || '',
      ...agent,
    };

    this.agents.set(agentId, normalized);
    this.emit('agent:registered', { agentId });
    return this._sanitizeAgent(normalized);
  }

  /**
   * Get an agent by ID or name
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} Sanitized agent or null
   */
  get(agentId) {
    if (!agentId) return null;
    
    // Direct lookup by ID
    let agent = this.agents.get(agentId);
    
    // Fallback: search by name (case-insensitive) for backward compatibility
    if (!agent) {
      const lowerId = agentId.toLowerCase();
      agent = Array.from(this.agents.values()).find(
        a => a.name?.toLowerCase() === lowerId || a.id?.toLowerCase() === lowerId
      );
    }
    
    return agent ? this._sanitizeAgent(agent) : null;
  }

  /**
   * List all registered agents
   * @returns {Array<Object>} List of sanitized agents
   */
  list() {
    return Array.from(this.agents.values(), (agent) => this._sanitizeAgent(agent));
  }

  /**
   * Discover agents by query
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching sanitized agents
   */
  discover(query) {
    if (!query) {
      return this.list();
    }

    const normalizedQuery = String(query).toLowerCase();
    return this.list().filter((agent) => {
      return (
        agent.id.toLowerCase().includes(normalizedQuery) ||
        agent.name.toLowerCase().includes(normalizedQuery) ||
        agent.description.toLowerCase().includes(normalizedQuery) ||
        agent.capabilities.some((capability) =>
          String(capability).toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }

  /**
   * Find agents by required capabilities
   * @param {Array<string>} capabilities - Required capabilities
   * @returns {Array<Object>} Matching sanitized agents
   */
  findAgentsByCapabilities(capabilities = []) {
    const wanted = new Set(capabilities.map((capability) => String(capability).toLowerCase()));
    return this.list().filter((agent) =>
      agent.capabilities.some((capability) => wanted.has(String(capability).toLowerCase()))
    );
  }

  /**
   * Execute an agent's handler
   * @param {string} agentId - Agent identifier
   * @param {Object} input - Input payload
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(agentId, input = {}, context = {}) {
    const agent = this.agents.get(agentId) || this.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    // Some legacy agents might use 'handler', others might be class instances with 'execute'
    const handler = agent.handler || (typeof agent.execute === 'function' ? agent.execute.bind(agent) : null);
    
    if (typeof handler !== 'function') {
      throw new Error(`Agent ${agentId} does not have a valid handler or execute method`);
    }

    const startedAt = Date.now();
    try {
      const result = await handler(input, context);
      const payload = {
        agentId: agent.id,
        duration: Date.now() - startedAt,
        result,
      };
      this.emit('agent:executed', payload);
      return {
        agentId: agent.id,
        result,
        executionId: this._generateExecutionId(),
      };
    } catch (error) {
      this.emit('agent:failed', {
        agentId: agent.id,
        duration: Date.now() - startedAt,
        error,
      });
      throw error;
    }
  }

  /**
   * Get formatted prompt for an agent
   * @param {string} agentId - Agent identifier
   * @returns {Promise<string>} Formatted prompt
   */
  async getAgentPrompt(agentId) {
    const agent = this.get(agentId);
    if (!agent) {
      return `You are agent ${agentId}.`;
    }
    return `${agent.name}: ${agent.description || 'Execute the assigned task.'}`;
  }

  /**
   * Legacy compatibility: Get agent by name
   * @param {string} name - Agent name
   * @returns {Object|null} Agent definition
   */
  getAgentByName(name) {
    return this.get(name);
  }

  /**
   * Legacy compatibility: List agent names
   * @returns {Array<string>} List of names
   */
  listAgentNames() {
    return Array.from(this.agents.values(), a => a.name);
  }

  _sanitizeAgent(agent) {
    // Remove internal properties or functions before returning to caller
    const { handler, ...rest } = agent;
    return rest;
  }

  _generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const registry = new UnifiedRegistry();
export { UnifiedRegistry };
export default UnifiedRegistry;
