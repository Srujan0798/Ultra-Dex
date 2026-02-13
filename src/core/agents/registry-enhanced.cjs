/**
 * Agent Registry - Central registry for all agents
 * Provides discovery, management, and coordination of agents
 *
 * @module AgentRegistry
 * @version 1.0.0
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class AgentRegistry extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      registryPath: config.registryPath || './data/agent-registry.json',
      autoLoad: config.autoLoad !== false,
      maxAgents: config.maxAgents || 100,
      ...config,
    };

    this.agents = new Map();
    this.sessions = new Map();
    this.capabilities = new Map();
    this.metrics = {
      registered: 0,
      executed: 0,
      failed: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize the registry
   */
  async initialize() {
    if (this.config.autoLoad) {
      await this._loadRegistry();
    }

    this.initialized = true;
    this.emit('initialized', { agentCount: this.agents.size });
    return true;
  }

  /**
   * Register a new agent
   * @param {Object} agentConfig - Agent configuration
   * @returns {Promise<Object>} Registration result
   */
  async register(agentConfig) {
    this._ensureInitialized();

    const {
      id,
      name,
      description,
      capabilities = [],
      handler,
      config = {},
      tags = [],
      version = '1.0.0',
      author,
      dependencies = [],
      requires = {},
    } = agentConfig;

    if (!id || !name || !handler) {
      throw new Error('Agent registration requires id, name, and handler');
    }

    if (this.agents.has(id)) {
      throw new Error(`Agent with id '${id}' already registered`);
    }

    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum agent limit (${this.config.maxAgents}) reached`);
    }

    const agent = {
      id,
      name,
      description,
      capabilities,
      handler,
      config,
      tags,
      version,
      author,
      dependencies,
      requires,
      registeredAt: new Date().toISOString(),
      status: 'idle',
      executionCount: 0,
      lastExecuted: null,
      averageExecutionTime: 0,
    };

    this.agents.set(id, agent);

    // Index capabilities
    capabilities.forEach((cap) => {
      if (!this.capabilities.has(cap)) {
        this.capabilities.set(cap, new Set());
      }
      this.capabilities.get(cap).add(id);
    });

    this.metrics.registered++;

    this.emit('agent:registered', { id, name, capabilities });

    // Persist registry
    await this._saveRegistry();

    return {
      id,
      registered: true,
      timestamp: agent.registeredAt,
    };
  }

  /**
   * Execute an agent
   * @param {string} agentId - Agent ID
   * @param {Object} input - Input parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(agentId, input, options = {}) {
    this._ensureInitialized();

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const { sessionId = null, timeout = 30000, context = {}, trace = true } = options;

    const executionId = this._generateExecutionId();
    const startTime = Date.now();

    // Create execution context
    const executionContext = {
      id: executionId,
      agentId,
      sessionId,
      input,
      context: {
        ...context,
        agent: agent.config,
        registry: this,
      },
      startedAt: new Date().toISOString(),
      trace: trace ? [] : null,
    };

    try {
      agent.status = 'running';

      // Check dependencies
      await this._checkDependencies(agent);

      // Execute with timeout
      const result = await this._executeWithTimeout(
        agent.handler,
        input,
        executionContext,
        timeout
      );

      const executionTime = Date.now() - startTime;

      // Update agent metrics
      agent.executionCount++;
      agent.lastExecuted = new Date().toISOString();
      agent.averageExecutionTime =
        (agent.averageExecutionTime * (agent.executionCount - 1) + executionTime) /
        agent.executionCount;
      agent.status = 'idle';

      this.metrics.executed++;

      this.emit('agent:executed', {
        id: executionId,
        agentId,
        duration: executionTime,
        success: true,
      });

      return {
        executionId,
        agentId,
        result,
        duration: executionTime,
        timestamp: new Date().toISOString(),
        trace: executionContext.trace,
      };
    } catch (error) {
      agent.status = 'error';
      this.metrics.failed++;

      this.emit('agent:failed', {
        id: executionId,
        agentId,
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Discover agents by capability
   * @param {string} capability - Capability to search for
   * @returns {Array<Object>} Matching agents
   */
  discover(capability) {
    this._ensureInitialized();

    const agentIds = this.capabilities.get(capability);
    if (!agentIds) return [];

    return Array.from(agentIds).map((id) => {
      const agent = this.agents.get(id);
      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        version: agent.version,
        author: agent.author,
        status: agent.status,
      };
    });
  }

  /**
   * Find agent by natural language query
   * @param {string} query - Natural language query
   * @returns {Array<Object>} Matching agents
   */
  find(query) {
    this._ensureInitialized();

    const queryLower = query.toLowerCase();
    const matches = [];

    for (const agent of this.agents.values()) {
      const score = this._calculateMatchScore(agent, queryLower);
      if (score > 0) {
        matches.push({ agent: this._sanitizeAgent(agent), score });
      }
    }

    return matches.sort((a, b) => b.score - a.score).map((m) => m.agent);
  }

  /**
   * List all agents
   * @param {Object} filters - Filter options
   * @returns {Array<Object>} List of agents
   */
  list(filters = {}) {
    this._ensureInitialized();

    const { tags, status, capabilities } = filters;
    let agents = Array.from(this.agents.values());

    if (tags && tags.length > 0) {
      agents = agents.filter((a) => tags.some((t) => a.tags.includes(t)));
    }

    if (status) {
      agents = agents.filter((a) => a.status === status);
    }

    if (capabilities && capabilities.length > 0) {
      agents = agents.filter((a) => capabilities.some((c) => a.capabilities.includes(c)));
    }

    return agents.map((a) => this._sanitizeAgent(a));
  }

  /**
   * Get agent by ID
   * @param {string} id - Agent ID
   * @returns {Object|null} Agent or null
   */
  get(id) {
    this._ensureInitialized();
    const agent = this.agents.get(id);
    return agent ? this._sanitizeAgent(agent) : null;
  }

  /**
   * Update agent configuration
   * @param {string} id - Agent ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async update(id, updates) {
    this._ensureInitialized();

    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent '${id}' not found`);
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'config', 'tags', 'version'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        agent[field] = updates[field];
      }
    });

    agent.updatedAt = new Date().toISOString();

    await this._saveRegistry();

    this.emit('agent:updated', { id });

    return { id, updated: true };
  }

  /**
   * Unregister an agent
   * @param {string} id - Agent ID
   * @returns {Promise<Object>} Unregister result
   */
  async unregister(id) {
    this._ensureInitialized();

    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent '${id}' not found`);
    }

    // Remove from capability index
    agent.capabilities.forEach((cap) => {
      const agents = this.capabilities.get(cap);
      if (agents) {
        agents.delete(id);
        if (agents.size === 0) {
          this.capabilities.delete(cap);
        }
      }
    });

    this.agents.delete(id);

    await this._saveRegistry();

    this.emit('agent:unregistered', { id });

    return { id, unregistered: true };
  }

  /**
   * Create a session for multi-agent workflows
   * @param {Object} options - Session options
   * @returns {Object} Session
   */
  createSession(options = {}) {
    this._ensureInitialized();

    const sessionId = this._generateSessionId();
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      agents: [],
      context: options.context || {},
      status: 'active',
      metadata: options.metadata || {},
    };

    this.sessions.set(sessionId, session);

    this.emit('session:created', { id: sessionId });

    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add agent to session
   * @param {string} sessionId - Session ID
   * @param {string} agentId - Agent ID
   * @param {Object} config - Agent-specific config
   */
  addToSession(sessionId, agentId, config = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found`);
    }

    if (!this.agents.has(agentId)) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    session.agents.push({
      agentId,
      config,
      addedAt: new Date().toISOString(),
    });

    this.emit('session:agentAdded', { sessionId, agentId });
  }

  /**
   * Get registry statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      agents: this.agents.size,
      sessions: this.sessions.size,
      capabilities: this.capabilities.size,
      ...this.metrics,
    };
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Registry not initialized. Call initialize() first.');
    }
  }

  async _loadRegistry() {
    try {
      const data = await fs.readFile(this.config.registryPath, 'utf8');
      const registry = JSON.parse(data);

      // Restore agents (handlers can't be serialized, will need re-registration)
      if (registry.agents) {
        registry.agents.forEach((agentData) => {
          // Store without handler - will need to be re-registered with handler
          const { handler, ...rest } = agentData;
          this.agents.set(agentData.id, { ...rest, handler: null, status: 'idle' });
        });
      }
    } catch (error) {
      // Registry doesn't exist yet, that's fine
      this.emit('registry:empty');
    }
  }

  async _saveRegistry() {
    try {
      const registry = {
        agents: Array.from(this.agents.values()).map((agent) => {
          // Don't serialize handler function
          const { handler, ...rest } = agent;
          return rest;
        }),
        savedAt: new Date().toISOString(),
      };

      await fs.mkdir(path.dirname(this.config.registryPath), { recursive: true });
      await fs.writeFile(this.config.registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      this.emit('error', { operation: 'saveRegistry', error });
    }
  }

  async _checkDependencies(agent) {
    for (const depId of agent.dependencies) {
      if (!this.agents.has(depId)) {
        throw new Error(`Dependency '${depId}' not found for agent '${agent.id}'`);
      }
    }
  }

  _executeWithTimeout(handler, input, context, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent execution timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(handler(input, context))
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  _calculateMatchScore(agent, query) {
    let score = 0;

    // Name match
    if (agent.name.toLowerCase().includes(query)) score += 10;

    // Description match
    if (agent.description?.toLowerCase().includes(query)) score += 5;

    // Capability match
    agent.capabilities.forEach((cap) => {
      if (cap.toLowerCase().includes(query)) score += 8;
    });

    // Tag match
    agent.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(query)) score += 3;
    });

    return score;
  }

  _sanitizeAgent(agent) {
    // Remove internal properties when returning to callers
    const { handler, ...publicAgent } = agent;
    return publicAgent;
  }

  _generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { AgentRegistry };
