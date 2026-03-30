/**
 * MCP Server Manager
 * Manages Model Context Protocol servers for tool integration
 *
 * @module MCPServerManager
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

class MCPServerManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      serversPath: config.serversPath || './mcp/servers',
      maxServers: config.maxServers || 50,
      autoRestart: config.autoRestart !== false,
      restartDelay: config.restartDelay || 5000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      ...config,
    };

    this.servers = new Map();
    this.tools = new Map();
    this.resources = new Map();
    this.metrics = {
      serversStarted: 0,
      serversFailed: 0,
      toolCalls: 0,
      errors: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize MCP server manager
   */
  async initialize() {
    // Create servers directory
    await fs.mkdir(this.config.serversPath, { recursive: true });

    // Load built-in servers
    await this._loadBuiltInServers();

    // Start health check
    this._startHealthChecks();

    this.initialized = true;
    this.emit('initialized', { servers: this.servers.size });
    return true;
  }

  /**
   * Register an MCP server
   * @param {string} serverId - Server ID
   * @param {Object} config - Server configuration
   * @returns {Promise<Object>} Registration result
   */
  async registerServer(serverId, config) {
    this._ensureInitialized();

    if (this.servers.has(serverId)) {
      throw new Error(`Server '${serverId}' already registered`);
    }

    if (this.servers.size >= this.config.maxServers) {
      throw new Error(`Maximum server limit (${this.config.maxServers}) reached`);
    }

    const server = {
      id: serverId,
      name: config.name || serverId,
      description: config.description || '',
      command: config.command,
      args: config.args || [],
      env: config.env || {},
      tools: new Map(),
      resources: new Map(),
      process: null,
      status: 'stopped',
      lastError: null,
      restartCount: 0,
      config,
    };

    this.servers.set(serverId, server);

    this.emit('server:registered', { serverId });

    // Auto-start if configured
    if (config.autoStart !== false) {
      await this.startServer(serverId);
    }

    return { serverId, registered: true };
  }

  /**
   * Start an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<Object>} Start result
   */
  async startServer(serverId) {
    this._ensureInitialized();

    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server '${serverId}' not found`);
    }

    if (server.status === 'running') {
      return { serverId, status: 'already_running' };
    }

    try {
      // Spawn server process
      const env = { ...process.env, ...server.env };

      server.process = spawn(server.command, server.args, {
        env,
        cwd: server.config.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      server.status = 'starting';
      server.startedAt = new Date().toISOString();

      // Handle process events
      server.process.stdout.on('data', (data) => {
        this._handleServerOutput(serverId, data);
      });

      server.process.stderr.on('data', (data) => {
        this._handleServerError(serverId, data);
      });

      server.process.on('close', (code) => {
        this._handleServerExit(serverId, code);
      });

      server.process.on('error', (error) => {
        this._handleServerError(serverId, error);
      });

      // Wait for server to be ready
      await this._waitForServerReady(serverId);

      server.status = 'running';
      this.metrics.serversStarted++;

      this.emit('server:started', { serverId });

      return { serverId, status: 'running', pid: server.process.pid };
    } catch (error) {
      server.status = 'error';
      server.lastError = error.message;
      this.metrics.serversFailed++;

      this.emit('server:error', { serverId, error });
      throw error;
    }
  }

  /**
   * Stop an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<Object>} Stop result
   */
  async stopServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server '${serverId}' not found`);
    }

    if (server.status !== 'running') {
      return { serverId, status: 'not_running' };
    }

    try {
      // Graceful shutdown
      server.process.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (server.process && !server.process.killed) {
          server.process.kill('SIGKILL');
        }
      }, 5000);

      server.status = 'stopped';
      server.stoppedAt = new Date().toISOString();

      this.emit('server:stopped', { serverId });

      return { serverId, status: 'stopped' };
    } catch (error) {
      this.emit('server:error', { serverId, error });
      throw error;
    }
  }

  /**
   * Call a tool on an MCP server
   * @param {string} serverId - Server ID
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool result
   */
  async callTool(serverId, toolName, params = {}) {
    this._ensureInitialized();

    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server '${serverId}' not found`);
    }

    if (server.status !== 'running') {
      throw new Error(`Server '${serverId}' is not running`);
    }

    const tool = server.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found on server '${serverId}'`);
    }

    try {
      const request = {
        jsonrpc: '2.0',
        id: this._generateRequestId(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
        },
      };

      const result = await this._sendRequest(server, request);
      this.metrics.toolCalls++;

      this.emit('tool:called', { serverId, toolName });

      return result;
    } catch (error) {
      this.metrics.errors++;
      this.emit('tool:error', { serverId, toolName, error });
      throw error;
    }
  }

  /**
   * List available tools from all servers
   * @returns {Array<Object>} List of tools
   */
  listTools() {
    this._ensureInitialized();

    const tools = [];

    for (const [serverId, server] of this.servers) {
      if (server.status === 'running') {
        for (const [toolName, tool] of server.tools) {
          tools.push({
            name: toolName,
            server: serverId,
            description: tool.description,
            parameters: tool.parameters,
          });
        }
      }
    }

    return tools;
  }

  /**
   * Discover tools by capability
   * @param {string} capability - Capability to search for
   * @returns {Array<Object>} Matching tools
   */
  discoverTools(capability) {
    const allTools = this.listTools();

    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(capability.toLowerCase()) ||
        tool.description?.toLowerCase().includes(capability.toLowerCase())
    );
  }

  /**
   * Get server status
   * @param {string} serverId - Server ID
   * @returns {Object} Server status
   */
  getServerStatus(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return null;

    return {
      id: server.id,
      name: server.name,
      status: server.status,
      tools: server.tools.size,
      resources: server.resources.size,
      restartCount: server.restartCount,
      lastError: server.lastError,
      uptime: server.startedAt ? Date.now() - new Date(server.startedAt).getTime() : 0,
    };
  }

  /**
   * List all servers
   * @returns {Array<Object>} List of servers
   */
  listServers() {
    return Array.from(this.servers.keys()).map((id) => this.getServerStatus(id));
  }

  /**
   * Unregister a server
   * @param {string} serverId - Server ID
   */
  async unregisterServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    if (server.status === 'running') {
      await this.stopServer(serverId);
    }

    this.servers.delete(serverId);
    this.emit('server:unregistered', { serverId });
  }

  /**
   * Get manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const running = Array.from(this.servers.values()).filter((s) => s.status === 'running').length;

    return {
      servers: this.servers.size,
      running,
      tools: this.listTools().length,
      ...this.metrics,
    };
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('MCP Server Manager not initialized. Call initialize() first.');
    }
  }

  async _loadBuiltInServers() {
    // Register built-in MCP servers
    const builtInServers = [
      {
        id: 'github',
        name: 'GitHub MCP Server',
        description: 'Access GitHub repositories, issues, and pull requests',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '' },
        autoStart: false,
      },
      {
        id: 'slack',
        name: 'Slack MCP Server',
        description: 'Send messages and manage Slack channels',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-slack'],
        env: {
          SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
          SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '',
        },
        autoStart: false,
      },
      {
        id: 'notion',
        name: 'Notion MCP Server',
        description: 'Read and write Notion pages and databases',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-notion'],
        env: { NOTION_API_TOKEN: process.env.NOTION_API_TOKEN || '' },
        autoStart: false,
      },
      {
        id: 'linear',
        name: 'Linear MCP Server',
        description: 'Manage Linear issues and projects',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-linear'],
        env: { LINEAR_API_KEY: process.env.LINEAR_API_KEY || '' },
        autoStart: false,
      },
      {
        id: 'filesystem',
        name: 'Filesystem MCP Server',
        description: 'Read and write files on the local filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        autoStart: true,
      },
      {
        id: 'fetch',
        name: 'Fetch MCP Server',
        description: 'Fetch web content and APIs',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        autoStart: true,
      },
      {
        id: 'postgres',
        name: 'PostgreSQL MCP Server',
        description: 'Query PostgreSQL databases',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL || ''],
        autoStart: false,
      },
      {
        id: 'sqlite',
        name: 'SQLite MCP Server',
        description: 'Query SQLite databases',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', './data/memory.db'],
        autoStart: true,
      },
    ];

    for (const serverConfig of builtInServers) {
      try {
        await this.registerServer(serverConfig.id, serverConfig);
      } catch (error) {
        this.emit('server:registration_failed', { serverId: serverConfig.id, error });
      }
    }
  }

  _handleServerOutput(serverId, data) {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      const message = JSON.parse(data.toString());

      if (message.result?.tools) {
        // Server announced tools
        message.result.tools.forEach((tool) => {
          server.tools.set(tool.name, tool);
        });
      }

      if (message.result?.resources) {
        // Server announced resources
        message.result.resources.forEach((resource) => {
          server.resources.set(resource.uri, resource);
        });
      }

      this.emit('server:message', { serverId, message });
    } catch (error) {
      // Not JSON, just log output
      this.emit('server:output', { serverId, output: data.toString() });
    }
  }

  _handleServerError(serverId, data) {
    const server = this.servers.get(serverId);
    if (!server) return;

    server.lastError = data.toString();
    this.emit('server:error', { serverId, error: server.lastError });
  }

  _handleServerExit(serverId, code) {
    const server = this.servers.get(serverId);
    if (!server) return;

    server.status = 'stopped';
    server.exitCode = code;

    this.emit('server:exit', { serverId, code });

    // Auto-restart if enabled
    if (this.config.autoRestart && code !== 0) {
      server.restartCount++;

      if (server.restartCount <= 3) {
        setTimeout(() => {
          this.emit('server:restarting', { serverId, attempt: server.restartCount });
          this.startServer(serverId).catch(() => {});
        }, this.config.restartDelay);
      }
    }
  }

  async _waitForServerReady(serverId, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Server '${serverId}' failed to start within ${timeout}ms`));
      }, timeout);

      const checkInterval = setInterval(() => {
        const server = this.servers.get(serverId);
        if (server && server.status === 'running') {
          clearTimeout(timer);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  async _sendRequest(server, request) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      // Send request to server
      server.process.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const handler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            clearTimeout(timeout);
            server.process.stdout.off('data', handler);
            resolve(response.result);
          }
        } catch (error) {
          // Not the response we're waiting for
        }
      };

      server.process.stdout.on('data', handler);
    });
  }

  _startHealthChecks() {
    setInterval(() => {
      for (const [serverId, server] of this.servers) {
        if (server.status === 'running') {
          // Check if process is still alive
          if (server.process && server.process.killed) {
            this._handleServerExit(serverId, -1);
          }
        }
      }
    }, this.config.healthCheckInterval);
  }

  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Run a tool on the MCP server
   * @param {string} toolName - Tool name to run
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   */
  async run(toolName, args = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }
    
    this.metrics.toolCalls++;
    
    if (typeof tool.handler === 'function') {
      return await tool.handler(args);
    }
    
    return { result: 'Tool executed', tool: toolName, args };
  }
}

export { MCPServerManager };
export default MCPServerManager;
