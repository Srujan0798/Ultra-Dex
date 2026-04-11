import { EventEmitter } from 'events';
import { UnifiedMemory } from '../memory/unified-api.js';
import { UnifiedRegistry as AgentRegistry } from '../agents/unified-registry.js';
import { AgentAutopsy } from '../reliability/agent-autopsy.js';
import { AgentCoordinationProtocol } from '../protocols/coordination.js';
import { MCPServerManager } from '../mcp/server-manager.js';
import { SmartAIRouter as AIProviderRouter } from '../ai/router.js';
import { ObservabilitySystem } from '../system/observability.js';
import { ConfigManager } from '../system/config-manager.js';
import { TokenOptimizer } from '../performance/token-optimizer.js';
import { SkillsAPI, initializeSkills } from '../skills/index.js';
class UltraDexCore extends EventEmitter {
  constructor(config = {}) {
    super();
    this._config = {
      name: config.name || 'Ultra-Dex',
      version: config.version || '6.0.0',
      dataPath: config.dataPath || './data',
      ...config,
    };
    this.config = null;
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
    this.skills = null;
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
      this.config = new ConfigManager({
        env: userConfig.env || process.env.NODE_ENV || 'development',
        configPath: userConfig.configPath || './config',
      });
      await this.config.initialize();
      for (const [key, value] of Object.entries(userConfig)) {
        if (key !== 'env' && key !== 'configPath') {
          this.config.set(key, value);
        }
      }
      this.observability = new ObservabilitySystem({
        logPath: this.config.get(
          'observability.logPath',
          `${this.config.get('core.dataPath')}/observability`
        ),
        sampleRate: this.config.get('observability.sampleRate', 1),
      });
      await this.observability.initialize();
      this.observability.log('info', 'Ultra-Dex initialization started');
      this.observability.log('info', 'Initializing token optimizer...');
      this.tokenOptimizer = new TokenOptimizer({
        maxCacheSize: this.config.get('tokenOptimizer.maxCacheSize', 1e3),
        cacheTTL: this.config.get('tokenOptimizer.cacheTTL', 36e5),
        compressionEnabled: this.config.get('tokenOptimizer.compressionEnabled', true),
        dedupEnabled: this.config.get('tokenOptimizer.dedupEnabled', true),
        budgetLimit: this.config.get('tokenOptimizer.budgetLimit'),
        warnThreshold: this.config.get('tokenOptimizer.warnThreshold', 0.8),
      });
      await this.tokenOptimizer.initialize();
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
          ttl: this.config.get('memory.cache.ttl', 3e5),
          maxSize: this.config.get('memory.cache.maxSize', 1e3),
        },
        compression: this.config.get('memory.compression', true),
      });
      await this.memory.initialize();
      this.memory.on('error', (error) => {
        this.observability.log('error', 'Memory error', error);
      });
      this.observability.log('info', 'Initializing agent registry...');
      this.agents = new AgentRegistry({
        registryPath: this.config.get(
          'agents.registryPath',
          `${this.config.get('core.dataPath')}/agent-registry.json`
        ),
        maxAgents: this.config.get('agents.maxAgents', 100),
      });
      await this.agents.initialize();
      this.observability.log('info', 'Initializing agent autopsy...');
      this.autopsy = new AgentAutopsy({
        logPath: this.config.get(
          'reliability.logPath',
          `${this.config.get('core.dataPath')}/autopsy`
        ),
        heartbeatInterval: this.config.get('reliability.heartbeatInterval', 5e3),
        circuitBreakerThreshold: this.config.get('reliability.circuitBreakerThreshold', 5),
        circuitBreakerTimeout: this.config.get('reliability.circuitBreakerTimeout', 6e4),
      });
      await this.autopsy.initialize();
      this.observability.log('info', 'Initializing coordination protocol...');
      this.coordination = new AgentCoordinationProtocol({
        defaultTimeout: this.config.get('agents.defaultTimeout', 3e4),
        maxHops: 5,
        enableNegotiation: true,
        consensusThreshold: 0.66,
      });
      await this.coordination.initialize();
      this.observability.log('info', 'Initializing MCP server manager...');
      this.mcp = new MCPServerManager({
        serversPath: this.config.get(
          'mcp.serversPath',
          `${this.config.get('core.dataPath')}/mcp-servers`
        ),
        maxServers: this.config.get('mcp.maxServers', 50),
        autoRestart: this.config.get('mcp.autoRestart', true),
        restartDelay: this.config.get('mcp.restartDelay', 5e3),
        healthCheckInterval: this.config.get('mcp.healthCheckInterval', 3e4),
        memory: this.memory,
        agentRegistry: this.agents,
      });
      await this.mcp.initialize();
      this.observability.log('info', 'Initializing AI provider router...');
      this.router = new AIProviderRouter({
        defaultProvider: this.config.get('providers.defaultProvider', 'openai'),
        fallbackEnabled: this.config.get('providers.fallbackEnabled', true),
        costOptimization: this.config.get('providers.costOptimization', true),
        latencyTarget: this.config.get('providers.latencyTarget', 2e3),
        maxRetries: this.config.get('providers.maxRetries', 3),
        timeout: this.config.get('providers.timeout', 3e4),
      });
      await this.router.initialize();
      this.mcp.providerRouter = this.router;

      // Initialize skills system
      this.observability.log('info', 'Initializing skills system...');
      const skillsModule = await import('../skills/index.js');

      // Initialize all skills first
      skillsModule.initializeSkills();

      const skillsAPI = new skillsModule.SkillsAPI();

      // Initialize connector registry
      const connectorsModule = await import('../connectors/registry.js');
      const { connectorRegistry } = connectorsModule;

      // Register built-in connectors
      const githubModule = await import('../connectors/github.js');
      const snowflakeModule = await import('../connectors/snowflake.js');
      const slackModule = await import('../connectors/slack.js');
      const notionModule = await import('../connectors/notion.js');

      connectorRegistry.register(
        new githubModule.GitHubConnector({ token: process.env.GITHUB_TOKEN || '' })
      );
      connectorRegistry.register(
        new snowflakeModule.SnowflakeConnector({
          account: process.env.SNOWFLAKE_ACCOUNT || '',
          username: process.env.SNOWFLAKE_USERNAME || '',
          password: process.env.SNOWFLAKE_PASSWORD || '',
        })
      );
      connectorRegistry.register(
        new slackModule.SlackConnector({ token: process.env.SLACK_TOKEN || '' })
      );
      connectorRegistry.register(
        new notionModule.NotionConnector({ token: process.env.NOTION_TOKEN || '' })
      );

      // Initialize with connector executor
      const executorModule = await import('../skills/connector-executor.js');
      const executor = new executorModule.ConnectorSkillExecutor({
        aiRouter: this.router,
        memory: this.memory,
        governance: this.config,
        agentRegistry: this.agents,
        connectors: connectorRegistry,
        enableCache: true,
      });

      skillsAPI.initializeExecutor(executor);
      this.skills = skillsAPI;

      await this._loadDefaultProviders();
      await this._registerDefaultAgents();
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
    this.startedAt = /* @__PURE__ */ new Date().toISOString();
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
      const orchestrationSpan = this.observability.startSpan(trace.id, 'orchestration');
      const selectedAgents = await this._selectAgentsForTask(task);
      this.observability.addEvent(orchestrationSpan.id, 'agents_selected', {
        agents: selectedAgents.map((a) => a.id),
      });
      const session = this.coordination.createSession({
        goal: task,
        agents: selectedAgents.map((a) => a.id),
        leader: selectedAgents[0]?.id,
      });
      this.observability.addEvent(orchestrationSpan.id, 'session_created', {
        sessionId: session.id,
      });
      const contextSpan = this.observability.startSpan(trace.id, 'context_retrieval');
      const context = await this.memory.retrieve(task, {
        strategy: 'hybrid',
        limit: 10,
        sessionId: session.id,
      });
      this.observability.endSpan(contextSpan.id, { contextCount: context.items.length });
      const executionSpan = this.observability.startSpan(trace.id, 'execution');
      let result;
      if (selectedAgents.length === 1) {
        result = await this._executeSingleAgent(selectedAgents[0], task, context, session);
      } else {
        result = await this._executeMultiAgent(selectedAgents, task, context, session);
      }
      this.observability.endSpan(executionSpan.id, { success: !result.error });
      await this.memory.store(
        {
          task,
          result,
          sessionId: session.id,
          timestamp: /* @__PURE__ */ new Date().toISOString(),
        },
        {
          strategy: 'hybrid',
          priority: 'normal',
          tags: ['execution', 'completed'],
        }
      );
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
      const lastMessage = messages[messages.length - 1]?.content || '';
      const context = await this.memory.retrieve(lastMessage, {
        strategy: 'vector',
        limit: 5,
      });
      const enhancedMessages = [
        {
          role: 'system',
          content: `Relevant context:
${context.items.map((i) => i.content.text).join('\n')}`,
        },
        ...messages,
      ];
      const result = await this.router.chat(enhancedMessages, options);
      await this.memory.store(
        {
          messages: enhancedMessages,
          response: result,
          timestamp: /* @__PURE__ */ new Date().toISOString(),
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
      version: this.config?.version || this._config.version,
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
    if (this.mcp) {
      for (const server of this.mcp.listServers()) {
        if (server.status === 'running') {
          await this.mcp.stopServer(server.id);
        }
      }
    }
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
    this.observability.log('info', 'Default providers loaded');
  }
  async _registerDefaultAgents() {
    const defaultAgents = [
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Reviews code for quality and best practices',
        capabilities: ['code-review', 'quality-check'],
        handler: async (input, context) => {
          return { reviewed: true, issues: [] };
        },
      },
      {
        id: 'task-planner',
        name: 'Task Planner',
        description: 'Breaks down tasks into actionable steps',
        capabilities: ['planning', 'task-decomposition'],
        handler: async (input, context) => {
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
    const capabilities = this._extractCapabilities(task);
    let selected = [];
    for (const capability of capabilities) {
      const agents = this.agents.discover(capability);
      selected = [...selected, ...agents];
    }
    selected = [...new Map(selected.map((a) => [a.id, a])).values()];
    if (selected.length === 0) {
      const allAgents = this.agents.list();
      selected = allAgents.slice(0, 3);
    }
    return selected;
  }
  _extractCapabilities(task) {
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
    this.autopsy.monitor(agent.id, {
      maxResponseTime: 3e4,
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
      this.autopsy.heartbeat(agent.id, { status: 'healthy' });
      return result;
    } catch (error) {
      this.autopsy.heartbeat(agent.id, { status: 'error' });
      throw error;
    }
  }
  async _executeMultiAgent(agents, task, context, session) {
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
    this.memory?.on('stored', (data) => {
      this.observability.recordMetric('memory.stores', 1);
    });
    this.memory?.on('retrieved', (data) => {
      this.observability.recordMetric('memory.retrieves', 1);
      this.observability.recordMetric('memory.latency', data.duration);
    });
    this.agents?.on('agent:executed', (data) => {
      this.observability.recordMetric('agents.executions', 1);
      this.observability.recordMetric('agents.latency', data.duration);
    });
    this.agents?.on('agent:failed', (data) => {
      this.observability.recordMetric('agents.failures', 1);
      this.observability.createAlert('Agent Execution Failed', 'high', data);
    });
    this.autopsy?.on('autopsy:complete', (data) => {
      this.observability.recordMetric('autopsy.performed', 1);
      if (data.severity === 'critical') {
        this.observability.createAlert('Critical Agent Failure', 'critical', data);
      }
    });
    // Router events are handled internally by the router's metrics system
  }
}
var ultra_dex_core_default = UltraDexCore;
export { UltraDexCore, ultra_dex_core_default as default };
