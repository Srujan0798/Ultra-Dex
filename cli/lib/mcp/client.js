/**
 * MCP Client - Consume External MCP Servers
 * This allows Ultra-Dex to connect to GitHub MCP, Linear MCP, Notion MCP, etc.
 * Transforms Ultra-Dex from isolated tool to connected ecosystem hub
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { VERSION } from '../utils/version.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

// ============================================================================
// MCP CLIENT CONFIGURATION
// ============================================================================

const MCP_CLIENT_CONFIG = {
  // Known MCP servers
  servers: {
    github: {
      name: 'GitHub MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN },
      description: 'GitHub issues, PRs, and repository operations',
    },
    filesystem: {
      name: 'Filesystem MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
      description: 'File system operations',
    },
    postgres: {
      name: 'PostgreSQL MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: { POSTGRES_CONNECTION_STRING: process.env.DATABASE_URL },
      description: 'PostgreSQL database operations',
    },
    slack: {
      name: 'Slack MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_BOT_TOKEN: process.env.SLACK_TOKEN },
      description: 'Slack messaging and channels',
    },
    brave: {
      name: 'Brave Search MCP',
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-brave-search'],
      env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY },
      description: 'Web search via Brave',
    },
    memory: {
      name: 'Memory MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      description: 'Persistent memory storage',
    },
    puppeteer: {
      name: 'Puppeteer MCP',
      command: 'npx',
      args: ['-y', '@anthropic/mcp-server-puppeteer'],
      description: 'Browser automation',
    },
  },

  // State file
  stateFile: '.ultra-dex/mcp-connections.json',

  // Timeouts
  connectionTimeout: 30000,
  requestTimeout: 60000,
};

// ============================================================================
// MCP CONNECTION CLASS
// ============================================================================

/**
 * Connection to an MCP server
 */
export class MCPConnection extends EventEmitter {
  constructor(serverConfig) {
    super();
    this.config = serverConfig;
    this.process = null;
    this.connected = false;
    this.tools = [];
    this.resources = [];
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.buffer = '';
  }

  /**
   * Connect to MCP server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      // Validate command and args to prevent command injection
      if (!this.config.command || typeof this.config.command !== 'string') {
        reject(new ValidationError('Invalid command configuration'));
        return;
      }

      if (!Array.isArray(this.config.args)) {
        reject(new ValidationError('Invalid args configuration'));
        return;
      }

      // Sanitize environment variables
      const env = { ...process.env };
      if (this.config.env) {
        for (const [key, value] of Object.entries(this.config.env)) {
          if (value) {
            env[key] = value; // Only set if value exists
          }
        }
      }

      try {
        this.process = spawn(this.config.command, this.config.args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env,
        });
      } catch (err) {
        reject(new AppError(`Failed to spawn MCP server: ${err.message}`, { cause: err }));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new AppError('Connection timeout', { code: 'MCP_TIMEOUT' }));
        this.disconnect();
      }, MCP_CLIENT_CONFIG.connectionTimeout);

      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this._processBuffer();
      });

      this.process.stderr.on('data', (data) => {
        this.emit('error', data.toString());
      });

      this.process.on('close', (code) => {
        this.connected = false;
        this.emit('close', code);
      });

      this.process.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      // Initialize connection
      this._sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
        clientInfo: {
          name: 'ultra-dex',
          version: VERSION,
        },
      }).then(async (result) => {
        clearTimeout(timeout);
        this.connected = true;

        // Send initialized notification
        this._sendNotification('notifications/initialized', {});

        // List available tools
        try {
          const toolsResult = await this._sendRequest('tools/list', {});
          this.tools = toolsResult.tools || [];
        } catch {
          this.tools = [];
        }

        // List available resources
        try {
          const resourcesResult = await this._sendRequest('resources/list', {});
          this.resources = resourcesResult.resources || [];
        } catch {
          this.resources = [];
        }

        resolve({
          tools: this.tools,
          resources: this.resources,
          serverInfo: result.serverInfo,
        });
      }).catch(reject);
    });
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
    this.pendingRequests.clear();
  }

  /**
   * Call a tool
   */
  async callTool(name, arguments_) {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Tool name is required');
    }

    if (!this.connected) {
      throw new AppError(`Not connected to MCP server: ${this.config.name}`, { code: 'MCP_NOT_CONNECTED' });
    }

    return this._sendRequest('tools/call', {
      name,
      arguments: arguments_ || {},
    });
  }

  /**
   * Read a resource
   */
  async readResource(uri) {
    if (!uri || typeof uri !== 'string') {
      throw new ValidationError('Resource URI is required');
    }

    if (!this.connected) {
      throw new AppError(`Not connected to MCP server: ${this.config.name}`, { code: 'MCP_NOT_CONNECTED' });
    }

    return this._sendRequest('resources/read', { uri });
  }

  /**
   * Send JSON-RPC request
   */
  _sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin || this.process.stdin.destroyed) {
        reject(new AppError('MCP server process is not available', { code: 'MCP_PROCESS_ERROR' }));
        return;
      }

      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new AppError(`Request timeout (${method})`, { code: 'MCP_REQUEST_TIMEOUT' }));
        }
      }, MCP_CLIENT_CONFIG.requestTimeout);

      this.pendingRequests.get(id).timeout = timeout;

      try {
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } catch (err) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(new AppError(`Failed to write to MCP server: ${err.message}`, { cause: err }));
      }
    });
  }

  /**
   * Send notification (no response expected)
   */
  _sendNotification(method, params) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.process.stdin.write(JSON.stringify(notification) + '\n');
  }

  /**
   * Process incoming data buffer
   */
  _processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        this._handleMessage(message);
      } catch {
        // Ignore non-JSON lines
      }
    }
  }

  /**
   * Handle incoming message
   */
  _handleMessage(message) {
    // Response to our request
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject, timeout } = this.pendingRequests.get(message.id);
      clearTimeout(timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Unknown error'));
      } else {
        resolve(message.result);
      }
      return;
    }

    // Notification from server
    if (message.method) {
      this.emit('notification', message);
    }
  }
}

// ============================================================================
// MCP CLIENT HUB
// ============================================================================

/**
 * Hub for managing multiple MCP connections
 */
export class MCPHub {
  constructor() {
    this.connections = new Map();
    this.connecting = new Set();
    this.stateFile = MCP_CLIENT_CONFIG.stateFile;
  }

  /**
   * Connect to an MCP server
   */
  async connect(serverName, customConfig = null) {
    if (!serverName || typeof serverName !== 'string') {
      throw new ValidationError('Server name is required');
    }

    // Check if already connected
    if (this.connections.has(serverName) && this.connections.get(serverName).connected) {
      return this.connections.get(serverName);
    }

    // Handle race condition: check if already connecting
    if (this.connecting.has(serverName)) {
      // Wait for it to finish or timeout
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (!this.connecting.has(serverName)) {
            clearInterval(check);
            if (this.connections.has(serverName) && this.connections.get(serverName).connected) {
              resolve(this.connections.get(serverName));
            } else {
              reject(new AppError(`Failed to connect to ${serverName} (already in progress)`));
            }
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          reject(new AppError(`Timeout waiting for ${serverName} to connect`, { code: 'MCP_HUB_TIMEOUT' }));
        }, 35000);
      });
    }

    // Get server config
    const config = customConfig || MCP_CLIENT_CONFIG.servers[serverName];
    if (!config) {
      throw new ValidationError(`Unknown MCP server: ${serverName}`);
    }

    this.connecting.add(serverName);
    const connection = new MCPConnection(config);

    try {
      const result = await connection.connect();
      this.connections.set(serverName, connection);

      logger.success(`Connected to ${config.name}`);
      logger.debug(`  Tools: ${result.tools.map(t => t.name).join(', ') || 'none'}`);

      return connection;
    } catch (err) {
      logger.error(`Failed to connect to ${config.name}`, err);
      throw err;
    } finally {
      this.connecting.delete(serverName);
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName) {
    const connection = this.connections.get(serverName);
    if (connection) {
      try {
        await connection.disconnect();
      } catch (err) {
        logger.error(`Error disconnecting from ${serverName}`, err);
      } finally {
        this.connections.delete(serverName);
      }
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll() {
    const disconnects = Array.from(this.connections.keys()).map(name => this.disconnect(name));
    await Promise.all(disconnects);
  }

  /**
   * Call a tool on a connected server
   */
  async callTool(serverName, toolName, args) {
    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      throw new AppError(`Not connected to ${serverName}`, { code: 'MCP_HUB_NOT_CONNECTED' });
    }

    return connection.callTool(toolName, args);
  }

  /**
   * Read a resource from a connected server
   */
  async readResource(serverName, uri) {
    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      throw new AppError(`Not connected to ${serverName}`, { code: 'MCP_HUB_NOT_CONNECTED' });
    }

    return connection.readResource(uri);
  }

  /**
   * List all available tools across connections
   */
  listAllTools() {
    const tools = [];

    for (const [serverName, connection] of this.connections) {
      for (const tool of connection.tools) {
        tools.push({
          server: serverName,
          ...tool,
        });
      }
    }

    return tools;
  }

  /**
   * List all available resources across connections
   */
  listAllResources() {
    const resources = [];

    for (const [serverName, connection] of this.connections) {
      for (const resource of connection.resources) {
        resources.push({
          server: serverName,
          ...resource,
        });
      }
    }

    return resources;
  }

  /**
   * Get connection status
   */
  getStatus() {
    const status = {};

    for (const [name, connection] of this.connections) {
      status[name] = {
        connected: connection.connected,
        tools: connection.tools.length,
        resources: connection.resources.length,
      };
    }

    return status;
  }

  /**
   * Save connection state
   */
  async saveState() {
    const state = {
      connections: Array.from(this.connections.keys()),
      timestamp: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
  }

  /**
   * Load and restore connections from state
   */
  async restoreState() {
    try {
      const state = JSON.parse(await fs.readFile(this.stateFile, 'utf8'));

      for (const serverName of state.connections) {
        try {
          await this.connect(serverName);
        } catch {
          // Skip failed connections
        }
      }

      return state.connections;
    } catch {
      return [];
    }
  }
}

// ============================================================================
// GLOBAL HUB INSTANCE
// ============================================================================

export const mcpHub = new MCPHub();

// ============================================================================
// CLI HELPERS
// ============================================================================

/**
 * List available MCP servers
 */
export function listAvailableServers() {
  return Object.entries(MCP_CLIENT_CONFIG.servers).map(([name, config]) => ({
    name,
    description: config.description,
    command: `${config.command} ${config.args.join(' ')}`,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  MCPConnection,
  MCPHub,
  mcpHub,
  listAvailableServers,
  MCP_CLIENT_CONFIG,
};