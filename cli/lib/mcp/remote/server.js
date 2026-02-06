// Copyright (c) 2026 Ultra-Dex

/**
 * Remote MCP Server
 * Provides remote MCP server capabilities for team collaboration
 */

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../../utils/errors.js';

/**
 * Remote MCP Server Class
 */
export class RemoteMCPServer {
  constructor(options = {}) {
    this.port = options.port || 4000;
    this.host = options.host || '0.0.0.0';
    this.apiKey = options.apiKey || process.env.ULTRA_DEX_REMOTE_KEY;
    this.clients = new Set();
    this.app = express();
    this.server = null;
    this.wss = null;
    this.projectRoot = options.projectRoot || process.cwd();
    this.rateLimiter = new Map(); // Simple rate limiter
    this.connectionLimits = options.connectionLimits || { maxPerIP: 10, windowMs: 60000 };
  }

  /**
   * Initialize the server
   */
  async initialize() {
    printInfo(chalk.cyan(`\n📡 Starting Remote MCP Server on port ${this.port}\n`));

    // Setup Express middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Authentication middleware
    this.app.use((req, res, next) => {
      if (this.apiKey) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);
        if (token !== this.apiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
      }

      // Rate limiting
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - this.connectionLimits.windowMs;

      if (!this.rateLimiter.has(clientIP)) {
        this.rateLimiter.set(clientIP, []);
      }

      const requests = this.rateLimiter.get(clientIP);
      const recentRequests = requests.filter((time) => time > windowStart);

      if (recentRequests.length >= this.connectionLimits.maxPerIP) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      requests.push(now);
      this.rateLimiter.set(clientIP, requests);

      next();
    });

    // Setup routes
    this.setupRoutes();

    // Create HTTP server
    this.server = http.createServer(this.app);

    // Setup WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const clientIP = req.socket.remoteAddress;
      printInfo(chalk.blue(`🔗 New client connected: ${clientIP}`));

      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          printWarning(chalk.yellow(`⚠️  Invalid message from client: ${error.message}`));
        }
      });

      ws.on('close', () => {
        printInfo(chalk.gray(`🔗 Client disconnected: ${clientIP}`));
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        printError(chalk.red(`❌ WebSocket error: ${error.message}`));
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'welcome',
          message: 'Connected to Ultra-Dex Remote MCP Server',
          version: '3.7.2',
          timestamp: new Date().toISOString(),
        })
      );
    });

    printSuccess(chalk.green(`✅ Remote MCP Server initialized on port ${this.port}`));
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '3.7.2',
      });
    });

    // Project context endpoint
    this.app.get('/api/context', async (req, res) => {
      try {
        const contextPath = path.join(this.projectRoot, 'CONTEXT.md');
        const contextContent = await fs.readFile(contextPath, 'utf8');

        res.json({
          success: true,
          context: contextContent,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.status(404).json({
            success: false,
            error: 'CONTEXT.md not found in project root',
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      }
    });

    // Implementation plan endpoint
    this.app.get('/api/plan', async (req, res) => {
      try {
        const planPath = path.join(this.projectRoot, 'IMPLEMENTATION-PLAN.md');
        const planContent = await fs.readFile(planPath, 'utf8');

        res.json({
          success: true,
          plan: planContent,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.status(404).json({
            success: false,
            error: 'IMPLEMENTATION-PLAN.md not found in project root',
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      }
    });

    // State endpoint
    this.app.get('/api/state', async (req, res) => {
      try {
        const statePath = path.join(this.projectRoot, '.ultra', 'state.json');
        const stateContent = await fs.readFile(statePath, 'utf8');
        const state = JSON.parse(stateContent);

        res.json({
          success: true,
          state,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.status(404).json({
            success: false,
            error: 'State file not found',
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      }
    });

    // File sync endpoint
    this.app.post('/api/sync', async (req, res) => {
      const { filePath, content, action } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'filePath is required',
        });
      }

      try {
        const fullPath = path.join(this.projectRoot, filePath);

        if (action === 'delete') {
          await fs.unlink(fullPath);
        } else {
          // Ensure directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, content || '');
        }

        // Broadcast change to all clients
        this.broadcastToClients({
          type: 'file_change',
          filePath,
          action,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          message: `File ${action || 'updated'} successfully`,
          filePath,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // MCP tools endpoint
    this.app.post('/api/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const { params } = req.body;

      try {
        // In a real implementation, this would call the actual MCP tool
        // For now, we'll return a mock response
        const result = await this.executeMCPTOOL(toolName, params);

        res.json({
          success: true,
          result,
          tool: toolName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          tool: toolName,
        });
      }
    });
  }

  /**
   * Execute an MCP tool
   */
  async executeMCPTOOL(toolName, params) {
    // Mock implementation of MCP tools
    switch (toolName) {
      case 'read_code':
        const filePath = params.file_path || params.path;
        if (!filePath)
          throw new AppError('file_path is required for read_code tool', {
            code: 'INVALID_PARAMS',
          });

        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        return { content, path: filePath };

      case 'write_code':
        const writePath = params.file_path || params.path;
        const writeContent = params.content;
        if (!writePath || writeContent === undefined) {
          throw new AppError('file_path and content are required for write_code tool', {
            code: 'INVALID_PARAMS',
          });
        }

        const writeFullPath = path.join(this.projectRoot, writePath);
        await fs.mkdir(path.dirname(writeFullPath), { recursive: true });
        await fs.writeFile(writeFullPath, writeContent);
        return { success: true, path: writePath };

      case 'list_files':
        const dirPath = params.directory || '.';
        const fullDirPath = path.join(this.projectRoot, dirPath);
        const files = await fs.readdir(fullDirPath);
        return { files, directory: dirPath };

      default:
        throw new AppError(`Unknown MCP tool: ${toolName}`, { code: 'UNKNOWN_TOOL' });
    }
  }

  /**
   * Handle client WebSocket message
   */
  handleClientMessage(ws, data) {
    const { type, params } = data;

    printInfo(chalk.gray(`📨 Received message: ${type}`));

    switch (type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'request_context':
        this.sendContextToClient(ws);
        break;

      case 'request_plan':
        this.sendPlanToClient(ws);
        break;

      case 'request_state':
        this.sendStateToClient(ws);
        break;

      case 'execute_tool':
        this.executeToolForClient(ws, params);
        break;

      default:
        printWarning(chalk.yellow(`⚠️  Unknown message type: ${type}`));
        ws.send(
          JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${type}`,
            timestamp: new Date().toISOString(),
          })
        );
    }
  }

  /**
   * Send context to client
   */
  async sendContextToClient(ws) {
    try {
      const contextPath = path.join(this.projectRoot, 'CONTEXT.md');
      const contextContent = await fs.readFile(contextPath, 'utf8');

      ws.send(
        JSON.stringify({
          type: 'context_response',
          context: contextContent,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Failed to read context: ${error.message}`,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Send plan to client
   */
  async sendPlanToClient(ws) {
    try {
      const planPath = path.join(this.projectRoot, 'IMPLEMENTATION-PLAN.md');
      const planContent = await fs.readFile(planPath, 'utf8');

      ws.send(
        JSON.stringify({
          type: 'plan_response',
          plan: planContent,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Failed to read plan: ${error.message}`,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Send state to client
   */
  async sendStateToClient(ws) {
    try {
      const statePath = path.join(this.projectRoot, '.ultra', 'state.json');
      const stateContent = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateContent);

      ws.send(
        JSON.stringify({
          type: 'state_response',
          state,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Failed to read state: ${error.message}`,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Execute tool for client
   */
  async executeToolForClient(ws, params) {
    const { toolName, toolParams } = params;

    try {
      const result = await this.executeMCPTOOL(toolName, toolParams);

      ws.send(
        JSON.stringify({
          type: 'tool_result',
          result,
          tool: toolName,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Tool execution failed: ${error.message}`,
          tool: toolName,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcastToClients(message) {
    const payload = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  /**
   * Start the server
   */
  async start() {
    if (!this.server) {
      throw new AppError('Server not initialized. Call initialize() first.', {
        code: 'SERVER_NOT_INITIALIZED',
      });
    }

    return new Promise((resolve, reject) => {
      this.server.listen({ port: this.port, host: this.host }, () => {
        printSuccess(chalk.green(`🚀 Remote MCP Server started on ${this.host}:${this.port}`));
        printInfo(chalk.gray(`   API Key: ${this.apiKey ? 'Set' : 'Not required'}`));
        printInfo(chalk.gray(`   Project Root: ${this.projectRoot}`));
        resolve();
      });

      this.server.on('error', (error) => {
        printError(chalk.red(`❌ Failed to start server: ${error.message}`));
        reject(error);
      });
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
    }

    // Close all client connections
    for (const client of this.clients) {
      client.close();
    }

    printInfo(chalk.yellow('🛑 Remote MCP Server stopped'));
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      running: !!this.server && this.server.listening,
      port: this.port,
      host: this.host,
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create and start a remote MCP server
 */
export async function startRemoteMCPServer(options = {}) {
  const server = new RemoteMCPServer(options);
  await server.initialize();
  await server.start();

  return server;
}

export async function startRemoteServer(options = {}) {
  return startRemoteMCPServer(options);
}

/**
 * Register the remote command with Commander
 */
export function registerRemoteCommand(program) {
  program
    .command('mcp:remote')
    .description('Start/stop remote MCP server for team collaboration')
    .option('--port <port>', 'Port for the server (default: 4000)', '4000')
    .option('--host <host>', 'Host for the server (default: 0.0.0.0)', '0.0.0.0')
    .option('--api-key <key>', 'API key for authentication')
    .option('--project-root <path>', 'Project root directory', process.cwd())
    .option('--start', 'Start the remote server')
    .option('--stop', 'Stop the remote server')
    .option('--status', 'Show server status')
    .action(async (options) => {
      try {
        if (options.start) {
          printInfo(chalk.cyan('\n📡 Starting Remote MCP Server...\n'));

          const serverOptions = {
            port: parseInt(options.port),
            host: options.host,
            apiKey: options.apiKey,
            projectRoot: options.projectRoot,
          };

          const server = await startRemoteMCPServer(serverOptions);

          // Keep the process alive
          process.on('SIGINT', async () => {
            printInfo(chalk.yellow('\n⚠️  Shutting down remote MCP server...'));
            await server.stop();
            process.exit(0);
          });

          process.on('SIGTERM', async () => {
            printInfo(chalk.yellow('⚠️  Received SIGTERM, shutting down...'));
            await server.stop();
            process.exit(0);
          });
        } else if (options.status) {
          // In a real implementation, this would check the actual server status
          printInfo(chalk.cyan('\n📊 Remote MCP Server Status\n'));
          printInfo(chalk.gray('Status: Not running (this is a mock implementation)'));
          printInfo(chalk.gray('Port: ' + options.port));
          printInfo(chalk.gray('Host: ' + options.host));
        } else {
          printInfo(chalk.yellow('\n💡 Use --start to start the remote server'));
          printInfo(chalk.gray('   ultra-dex mcp:remote --start --port 4000'));
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Remote MCP command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  RemoteMCPServer,
  startRemoteServer,
  startRemoteMCPServer,
  registerRemoteCommand,
};
