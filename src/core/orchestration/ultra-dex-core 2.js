/**
 * Ultra-Dex Core Orchestrator
 * The central nervous system connecting all components
 *
 * @module UltraDexCore
 * @version 6.0.0
 */

import { EventEmitter } from 'events';
import { UnifiedMemory } from '../memory/unified-api.js';
import { AgentRegistry } from '../agents/registry-enhanced.js';
import { AgentAutopsy } from '../reliability/agent-autopsy.js';
import { AgentCoordinationProtocol } from '../protocols/coordination.js';
import { MCPServerManager } from '../mcp/server-manager.js';
import { AIProviderRouter } from '../../services/ai-providers/router.js';
import { ObservabilitySystem } from '../system/observability.js';
import { ConfigManager } from '../system/config-manager.js';
import { TokenOptimizer } from '../performance/token-optimizer.js';

class UltraDexCore extends EventEmitter {
  constructor(config = {}) {
    super();
    this.bootstrapConfig = {
      name: config.name || 'Ultra-Dex',
      version: config.version || '6.0.0',
      dataPath: config.dataPath || './data',
      ...config,
    };
    this.config = this.bootstrapConfig;

    // Core subsystems
    this.memory = null;
    this.agents = null;
    this.autopsy = null;
    this.coordination = null;
    this.mcp = null;
    this.router = null;
    this.observability = null;
    this.tokenOptimizer = null;

    this.status = 'stopped';
    this.startedAt = null;
    this.initialized = false;
  }

  /**
   * Initialize Ultra-Dex core
   */
  async initialize(userConfig = {}) {
    if (this.initialized) {
      throw new Error('Ultra-Dex already initialized');
    }

    this.emit('initializing');

    try {
      const runtimeConfig = {
        ...this.bootstrapConfig,
        ...userConfig,
      };

      // 0. Initialize Configuration Manager first
      this.config = new ConfigManager({
        env: runtimeConfig.env || process.env.NODE_ENV || 'development',
        configPath: runtimeConfig.configPath || './config',
      });
      await this.config.initialize();

      this.config.set('core.name', runtimeConfig.name || 'Ultra-Dex');
      this.config.set('core.version', runtimeConfig.version || '6.0.0');
      this.config.set('core.dataPath', runtimeConfig.dataPath || './data');

      // Merge user config with file config
      for (const [key, value] of Object.entries(runtimeConfig)) {
        if (!['env', 'configPath', 'name', 'version', 'dataPath'].includes(key)) {
          this.config.set(key, value);
        }
      }

      // 1. Initialize Observability (first for tracing)
      this.observability = new ObservabilitySystem({
        logPath: this.config.get(
          'observability.logPath',
          `${this.config.get('core.dataPath')}/observability`
        ),
        sampleRate: this.config.get('observability.sampleRate', 1.0),
      });
      await this.observability.initialize();
      this.observability.log('info', 'Ultra-Dex initialization started');

      // 2. Initialize Token Optimizer
      this.observability.log('info', 'Initializing token optimizer...');
      this.tokenOptimizer = new TokenOptimizer({
        maxCacheSize: this.config.get('tokenOptimizer.maxCacheSize', 1000),
        cacheTTL: this.config.get('tokenOptimizer.cacheTTL', 3600000),
        compressionEnabled: this.config.get('tokenOptimizer.compressionEnabled', true),
        dedupEnabled: this.config.get('tokenOptimizer.dedupEnabled', true),
        budgetLimit: this.config.get('tokenOptimizer.budgetLimit'),
        warnThreshold: this.config.get('tokenOptimizer.warnThreshold', 0.8),
      });
      await this.tokenOptimizer.initialize();

      // 3. Initialize Unified Memory
      this.observability.log('info', 'Initializing unified memory...');
      this.memory = new UnifiedMemory({
        sqlite: {
          database: this.config.get(
            'memory.sqlite.database',
            `${this.config.get('core.dataPath')}/memory.db`
          ),
        },
        chroma: {
          url: this.config.get('memory.chroma.url', 'http://localhost:8000'),
        },
        neo4j: {
          uri: this.config.get('memory.neo4j.uri', 'bolt://localhost:7687'),
          user: this.config.get('memory.neo4j.user', 'neo4j'),
          password: this.config.get('memory.neo4j.password', ''),
        },
        cache: {
          ttl: this.config.get('memory.cache.ttl', 300000),
          maxSize: this.config.get('memory.cache.maxSize', 1000),
        },
        compression: this.config.get('memory.compression', true),
      });
      await this.memory.initialize();
      this.memory.on('error', (error) => {
        this.observability.log('error', 'Memory error', error);
      });

      // 4. Initialize Agent Registry
      this.observability.log('info', 'Initializing agent registry...');
      this.agents = new AgentRegistry({
        registryPath: this.config.get(
          'agents.registryPath',
          `${this.config.get('core.dataPath')}/agent-registry.json`
        ),
        maxAgents: this.config.get('agents.maxAgents', 100),
      });
      await this.agents.initialize();

      // 5. Initialize Agent Autopsy
      this.observability.log('info', 'Initializing agent autopsy...');
      this.autopsy = new AgentAutopsy({
        logPath: this.config.get(
          'reliability.logPath',
          `${this.config.get('core.dataPath')}/autopsy`
        ),
        heartbeatInterval: this.config.get('reliability.heartbeatInterval', 5000),
        circuitBreakerThreshold: this.config.get('reliability.circuitBreakerThreshold', 5),
        circuitBreakerTimeout: this.config.get('reliability.circuitBreakerTimeout', 60000),
      });
      await this.autopsy.initialize();

      // 6. Initialize Coordination Protocol
      this.observability.log('info', 'Initializing coordination protocol...');
      this.coordination = new AgentCoordinationProtocol({
        defaultTimeout: this.config.get('agents.defaultTimeout', 30000),
        maxHops: 5,
        enableNegotiation: true,
        consensusThreshold: 0.66,
      });
      await this.coordination.initialize();

      // 7. Initialize MCP Server Manager
      this.observability.log('info', 'Initializing MCP server manager...');
      this.mcp = new MCPServerManager({
        serversPath: this.config.get(
          'mcp.serversPath',
          `${this.config.get('core.dataPath')}/mcp-servers`
        ),
        maxServers: this.config.get('mcp.maxServers', 50),
        autoRestart: this.config.get('mcp.autoRestart', true),
        restartDelay: this.config.get('mcp.restartDelay', 5000),
        healthCheckInterval: this.config.get('mcp.healthCheckInterval', 30000),
      });
      await this.mcp.initialize();

      // 8. Initialize AI Provider Router
      this.observability.log('info', 'Initializing AI provider router...');
      this.router = new AIProviderRouter({
        defaultProvider: this.config.get('providers.defaultProvider', 'openai'),
        fallbackEnabled: this.config.get('providers.fallbackEnabled', true),
        costOptimization: this.config.get('providers.costOptimization', true),
        latencyTarget: this.config.get('providers.latencyTarget', 2000),
        maxRetries: this.config.get('providers.maxRetries', 3),
        timeout: this.config.get('providers.timeout', 30000),
      });
      await this.router.initialize();

      // Load default providers
      await this._loadDefaultProviders();

      // 9. Register default agents
      await this._registerDefaultAgents();

      // Setup cross-component event handling
      this._setupEventHandlers();

      this.initialized = true;
      this.status = 'ready';

      this.observability.log('info', 'Ultra-Dex initialized successfully');
      this.emit('initialized');

      return {
        status: 'ready',
        components: {
          config: true,
          memory: true,
          agents: true,
          autopsy: true,
          coordination: true,
          mcp: true,
          router: true,
          observability: true,
          tokenOptimizer: true,
        },
      };
    } catch (error) {
      this.observability?.log('error', 'Initialization failed', { error: error.message });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start Ultra-Dex services
   */
  async start() {
    if (!this.initialized) {
      throw new Error('Ultra-Dex not initialized. Call initialize() first.');
    }

    this.emit('starting');
    this.observability.log('info', 'Starting Ultra-Dex services...');

    // Start MCP servers
    const mcpStats = this.mcp.getStats();
    this.observability.log('info', `Starting ${mcpStats.servers} MCP servers...`);

    for (const server of this.mcp.listServers()) {
      if (server.status === 'stopped') {
        try {
          await this.mcp.startServer(server.id);
        } catch (error) {
          this.observability.log('warn', `Failed to start MCP server ${server.id}`, {
            error: error.message,
          });
        }
      }
    }

    this.status = 'running';
    this.startedAt = new Date().toISOString();

    this.observability.log('info', 'Ultra-Dex services started');
    this.emit('started');

    return { status: 'running', startedAt: this.startedAt };
  }

  /**
   * Execute a task with full orchestration
   * @param {string} task - Task description
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(task, options = {}) {
    this._ensureReady();

    const trace = this.observability.startTrace('task_execution', {
      task,
      options,
    });

    try {
      // Start orchestration span
      const orchestrationSpan = this.observability.startSpan(trace.id, 'orchestration');

      // 1. Analyze task and select agents
      const selectedAgents = await this._selectAgentsForTask(task);
      this.observability.addEvent(orchestrationSpan.id, 'agents_selected', {
        agents: selectedAgents.map((a) => a.id),
      });

      // 2. Create coordination session
      const session = this.coordination.createSession({
        goal: task,
        agents: selectedAgents.map((a) => a.id),
        leader: selectedAgents[0]?.id,
      });
      this.observability.addEvent(orchestrationSpan.id, 'session_created', {
        sessionId: session.id,
      });

      // 3. Retrieve relevant context
      const contextSpan = this.observability.startSpan(trace.id, 'context_retrieval');
      const context = await this.memory.retrieve(task, {
        strategy: 'hybrid',
        limit: 10,
        sessionId: session.id,
      });
      this.observability.endSpan(contextSpan.id, { contextCount: context.items.length });

      // 4. Execute with coordination
      const executionSpan = this.observability.startSpan(trace.id, 'execution');

      let result;
      if (selectedAgents.length === 1) {
        // Single agent execution
        result = await this._executeSingleAgent(selectedAgents[0], task, context, session);
      } else {
        // Multi-agent coordination
        result = await this._executeMultiAgent(selectedAgents, task, context, session);
      }

      this.observability.endSpan(executionSpan.id, { success: !result.error });

      // 5. Store result in memory
      await this.memory.store(
        {
          task,
          result,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
        },
        {
          strategy: 'hybrid',
          priority: 'normal',
          tags: ['execution', 'completed'],
        }
      );

      // 6. End coordination session
      this.coordination.endSession(session.id);

      this.observability.endSpan(orchestrationSpan.id, { success: true });
      this.observability.endTrace(trace.id, { success: true });

      return {
        success: true,
        result,
        sessionId: session.id,
        traceId: trace.id,
        agents: selectedAgents.map((a) => a.id),
        contextItems: context.items.length,
      };
    } catch (error) {
      this.observability.endTrace(trace.id, { error: error.message });

      // Perform autopsy
      await this.autopsy.performAutopsy('orchestrator', error, {
        executionId: trace.id,
        input: task,
      });

      throw error;
    }
  }

  /**
   * Chat with AI using provider routing
   * @param {Array<Object>} messages - Chat messages
   * @param {Object} options - Chat options
   * @returns {Promise<Object>} Chat result
   */
  async chat(messages, options = {}) {
    this._ensureReady();

    const trace = this.observability.startTrace('chat', { messageCount: messages.length });

    try {
      // Retrieve relevant context
      const lastMessage = messages[messages.length - 1]?.content || '';
      const context = await this.memory.retrieve(lastMessage, {
        strategy: 'vector',
        limit: 5,
      });

      // Enhance messages with context
      const enhancedMessages = [
        {
          role: 'system',
          content: `Relevant context:\n${context.items.map((i) => i.content.text).join('\n')}`,
        },
        ...messages,
      ];

      // Route to AI provider
      const result = await this.router.chat(enhancedMessages, options);

      // Store conversation
      await this.memory.store(
        {
          messages: enhancedMessages,
          response: result,
          timestamp: new Date().toISOString(),
        },
        {
          strategy: 'sql',
          priority: 'normal',
        }
      );

      this.observability.endTrace(trace.id, { success: true });

      return result;
    } catch (error) {
      this.observability.endTrace(trace.id, { error: error.message });
      throw error;
    }
  }

  /**
   * Call an MCP tool
   * @param {string} serverId - Server ID
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool result
   */
  async callTool(serverId, toolName, params) {
    this._ensureReady();

    const trace = this.observability.startTrace('mcp_tool_call', {
      server: serverId,
      tool: toolName,
    });

    try {
      const result = await this.mcp.callTool(serverId, toolName, params);
      this.observability.endTrace(trace.id, { success: true });
      return result;
    } catch (error) {
      this.observability.endTrace(trace.id, { error: error.message });
      throw error;
    }
  }

  /**
   * Get system status
   * @returns {Object} System status
   */
  getStatus() {
    return {
      status: this.status,
      version: this.config?.get?.('core.version', this.bootstrapConfig.version) ?? '6.0.0',
      startedAt: this.startedAt,
      uptime: this.startedAt ? Date.now() - new Date(this.startedAt).getTime() : 0,
      components: {
        memory: this.memory?.getStats() || null,
        agents: this.agents?.getStats() || null,
        mcp: this.mcp?.getStats() || null,
        router: this.router?.getStats() || null,
        observability: this.observability?.getDashboard() || null,
      },
    };
  }

  /**
   * Get health check
   * @returns {Object} Health status
   */
  health() {
    const checks = {
      memory: this.memory?.initialized || false,
      agents: this.agents?.initialized || false,
      mcp: this.mcp?.initialized || false,
      router: this.router?.initialized || false,
      observability: this.observability?.initialized || false,
    };

    const healthy = Object.values(checks).every((v) => v);

    return {
      healthy,
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
    };
  }

  /**
   * Stop Ultra-Dex
   */
  async stop() {
    this.emit('stopping');
    this.observability?.log('info', 'Stopping Ultra-Dex...');

    // Stop MCP servers
    if (this.mcp) {
      for (const server of this.mcp.listServers()) {
        if (server.status === 'running') {
          await this.mcp.stopServer(server.id);
        }
      }
    }

    // Close memory connections
    if (this.memory) {
      await this.memory.close();
    }

    this.status = 'stopped';
    this.observability?.log('info', 'Ultra-Dex stopped');
    this.emit('stopped');
  }

  // Private methods
  _ensureReady() {
    if (!this.initialized || this.status !== 'running') {
      throw new Error('Ultra-Dex not ready. Call initialize() and start() first.');
    }
  }

  async _loadDefaultProviders() {
    // This would load provider configurations from environment or config
    // Placeholder for now
    this.observability.log('info', 'Default providers loaded');
  }

  async _registerDefaultAgents() {
    // Register built-in agents
    const defaultAgents = [
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Reviews code for quality and best practices',
        capabilities: ['code-review', 'quality-check'],
        handler: async (input, context) => {
          // Placeholder - would call AI provider
          return { reviewed: true, issues: [] };
        },
      },
      {
        id: 'task-planner',
        name: 'Task Planner',
        description: 'Breaks down tasks into actionable steps',
        capabilities: ['planning', 'task-decomposition'],
        handler: async (input, context) => {
          // Placeholder
          return { plan: [], steps: 0 };
        },
      },
      {
        id: 'context-manager',
        name: 'Context Manager',
        description: 'Manages and retrieves relevant context',
        capabilities: ['context-retrieval', 'memory-management'],
        handler: async (input, context) => {
          const memory = context.registry?.memory;
          if (memory) {
            return await memory.retrieve(input);
          }
          return { items: [] };
        },
      },
    ];

    for (const agentConfig of defaultAgents) {
      try {
        await this.agents.register(agentConfig);
      } catch (error) {
        this.observability.log('warn', `Failed to register agent ${agentConfig.id}`, {
          error: error.message,
        });
      }
    }
  }

  async _selectAgentsForTask(task) {
    // Find agents by capability matching
    const capabilities = this._extractCapabilities(task);

    let selected = [];
    for (const capability of capabilities) {
      const agents = this.agents.discover(capability);
      selected = [...selected, ...agents];
    }

    // Remove duplicates
    selected = [...new Map(selected.map((a) => [a.id, a])).values()];

    // If no specific match, return general-purpose agents
    if (selected.length === 0) {
      const allAgents = this.agents.list();
      selected = allAgents.slice(0, 3); // Top 3 agents
    }

    return selected;
  }

  _extractCapabilities(task) {
    // Simple keyword-based capability extraction
    const capabilities = [];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('code') || taskLower.includes('review')) {
      capabilities.push('code-review');
    }
    if (taskLower.includes('plan') || taskLower.includes('break down')) {
      capabilities.push('planning');
    }
    if (taskLower.includes('context') || taskLower.includes('remember')) {
      capabilities.push('context-retrieval');
    }
    if (taskLower.includes('write') || taskLower.includes('generate')) {
      capabilities.push('content-generation');
    }

    return capabilities;
  }

  async _executeSingleAgent(agent, task, context, session) {
    // Monitor agent
    this.autopsy.monitor(agent.id, {
      maxResponseTime: 30000,
      maxFailures: 2,
    });

    try {
      const result = await this.agents.execute(
        agent.id,
        {
          task,
          context: context.items,
          sessionId: session.id,
        },
        {
          sessionId: session.id,
          trace: true,
        }
      );

      // Record success
      this.autopsy.heartbeat(agent.id, { status: 'healthy' });

      return result;
    } catch (error) {
      // Record failure
      this.autopsy.heartbeat(agent.id, { status: 'error' });
      throw error;
    }
  }

  async _executeMultiAgent(agents, task, context, session) {
    // Use coordination protocol
    const taskDecomposition = {
      goal: task,
      subtasks: agents.map((agent, index) => ({
        id: `subtask-${index}`,
        description: `${agent.name} handles part ${index + 1}`,
        agentId: agent.id,
      })),
    };

    return await this.coordination.coordinate(session.id, taskDecomposition);
  }

  _setupEventHandlers() {
    // Forward memory events to observability
    this.memory?.on('stored', (data) => {
      this.observability.recordMetric('memory.stores', 1);
    });

    this.memory?.on('retrieved', (data) => {
      this.observability.recordMetric('memory.retrieves', 1);
      this.observability.recordMetric('memory.latency', data.duration);
    });

    // Forward agent events
    this.agents?.on('agent:executed', (data) => {
      this.observability.recordMetric('agents.executions', 1);
      this.observability.recordMetric('agents.latency', data.duration);
    });

    this.agents?.on('agent:failed', (data) => {
      this.observability.recordMetric('agents.failures', 1);
      this.observability.createAlert('Agent Execution Failed', 'high', data);
    });

    // Forward autopsy events
    this.autopsy?.on('autopsy:complete', (data) => {
      this.observability.recordMetric('autopsy.performed', 1);
      if (data.severity === 'critical') {
        this.observability.createAlert('Critical Agent Failure', 'critical', data);
      }
    });

    // Forward router events
    this.router?.on('request:success', (data) => {
      this.observability.recordMetric('router.requests', 1);
      this.observability.recordMetric('router.latency', data.latency);
      this.observability.recordMetric('router.cost', data.cost);
    });

    this.router?.on('request:error', (data) => {
      this.observability.recordMetric('router.errors', 1);
    });
  }
}

export { UltraDexCore };
export default UltraDexCore;
