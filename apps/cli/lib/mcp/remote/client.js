// Copyright (c) 2026 Ultra-Dex

/**
 * Remote MCP Client
 * Connects to remote MCP server for team collaboration
 */

import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../../utils/output.js';
import chalk from 'chalk';


/**
 * Remote MCP Client Class
 */
export class RemoteMCPClient {
  constructor(options = {}) {
    this.serverUrl =
      options.serverUrl || process.env.ULTRA_DEX_REMOTE_SERVER_URL || 'ws://localhost:4000';
    this.apiKey = options.apiKey || process.env.ULTRA_DEX_REMOTE_KEY;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 5000; // 5 seconds
    this.projectRoot = options.projectRoot || process.cwd();
    this.messageQueue = [];
    this.messageHandlers = new Map();
  }

  /**
   * Connect to remote server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      printInfo(chalk.cyan(`🔗 Connecting to remote MCP server: ${this.serverUrl}`));

      const headers = {};
      if (this.apiKey) {
        headers.Authorization = `Bearer ${this.apiKey}`;
      }

      this.ws = new WebSocket(this.serverUrl, { headers });

      this.ws.on('open', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        printSuccess(chalk.green('✅ Connected to remote MCP server'));

        // Process queued messages
        this.processMessageQueue();

        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          printWarning(chalk.yellow(`⚠️  Invalid message received: ${error.message}`));
        }
      });

      this.ws.on('close', (code, reason) => {
        this.connected = false;
        printWarning(
          chalk.yellow(`🔗 Disconnected from server (code: ${code}, reason: ${reason})`)
        );

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          printInfo(
            chalk.gray(
              `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            )
          );

          setTimeout(() => {
            this.connect().catch((err) => {
              printError(chalk.red(`❌ Reconnection failed: ${err.message}`));
            });
          }, this.reconnectDelay);
        } else {
          printError(chalk.red('❌ Max reconnection attempts reached'));
        }
      });

      this.ws.on('error', (error) => {
        printError(chalk.red(`❌ Connection error: ${error.message}`));
        reject(error);
      });
    });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    const { type, data, _timestamp } = message;

    printInfo(chalk.gray(`📥 Received: ${type}`));

    // Handle specific message types
    switch (type) {
      case 'welcome':
        printSuccess(chalk.green(`🎉 ${data.message}`));
        break;

      case 'context_response':
        this.handleContextResponse(data);
        break;

      case 'plan_response':
        this.handlePlanResponse(data);
        break;

      case 'state_response':
        this.handleStateResponse(data);
        break;

      case 'tool_result':
        this.handleToolResult(data);
        break;

      case 'file_change':
        this.handleFileChange(data);
        break;

      case 'error':
        printError(chalk.red(`❌ Server error: ${data.message}`));
        break;

      default:
        // Check if there's a custom handler
        if (this.messageHandlers.has(type)) {
          this.messageHandlers.get(type)(data);
        } else {
          printWarning(chalk.yellow(`⚠️  Unknown message type: ${type}`));
        }
    }
  }

  /**
   * Handle context response
   */
  handleContextResponse(_data) {
    printInfo(chalk.blue('📋 Context received from server'));
    // In a real implementation, this would update local context
  }

  /**
   * Handle plan response
   */
  handlePlanResponse(_data) {
    printInfo(chalk.blue('📋 Plan received from server'));
    // In a real implementation, this would update local plan
  }

  /**
   * Handle state response
   */
  handleStateResponse(_data) {
    printInfo(chalk.blue('📊 State received from server'));
    // In a real implementation, this would update local state
  }

  /**
   * Handle tool result
   */
  handleToolResult(data) {
    printSuccess(chalk.green(`✅ Tool result received: ${data.tool}`));
    // In a real implementation, this would process the result
  }

  /**
   * Handle file change notification
   */
  async handleFileChange(data) {
    printInfo(chalk.yellow(`📝 File change detected: ${data.filePath} (${data.action})`));

    // In a real implementation, this would sync the file change locally
    if (data.action === 'update' || data.action === 'create') {
      try {
        // Request the updated file content from server
        this.requestFileContent(data.filePath);
      } catch (error) {
        printError(chalk.red(`❌ Failed to sync file: ${error.message}`));
      }
    }
  }

  /**
   * Send message to server
   */
  sendMessage(message) {
    if (!this.connected) {
      // Queue message if not connected
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      printError(chalk.red(`❌ Failed to send message: ${error.message}`));
      return false;
    }
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Request project context from server
   */
  requestContext() {
    return this.sendMessage({
      type: 'request_context',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request implementation plan from server
   */
  requestPlan() {
    return this.sendMessage({
      type: 'request_plan',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request project state from server
   */
  requestState() {
    return this.sendMessage({
      type: 'request_state',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Execute an MCP tool remotely
   */
  executeTool(toolName, params) {
    return this.sendMessage({
      type: 'execute_tool',
      params: { toolName, toolParams: params },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request file content from server
   */
  requestFileContent(filePath) {
    return this.sendMessage({
      type: 'request_file',
      params: { filePath },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send file content to server
   */
  sendFileContent(filePath, content) {
    return this.sendMessage({
      type: 'file_update',
      params: { filePath, content },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register a message handler
   */
  onMessageType(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Remove a message handler
   */
  offMessageType(messageType) {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Disconnect from server
   */
  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
      printInfo(chalk.gray('🔗 Disconnected from remote MCP server'));
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      serverUrl: this.serverUrl,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueSize: this.messageQueue.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sync local context with server
   */
  async syncContext(direction = 'both') {
    if (direction === 'pull' || direction === 'both') {
      printInfo(chalk.blue('📥 Pulling context from server...'));
      this.requestContext();
    }

    if (direction === 'push' || direction === 'both') {
      printInfo(chalk.blue('📤 Pushing local context to server...'));
      // In a real implementation, this would read local context and send it
      try {
        const contextPath = path.join(this.projectRoot, 'CONTEXT.md');
        const contextContent = await fs.readFile(contextPath, 'utf8');

        this.sendMessage({
          type: 'context_update',
          params: { content: contextContent },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          printError(chalk.red(`❌ Failed to sync context: ${error.message}`));
        }
      }
    }
  }

  /**
   * Sync implementation plan with server
   */
  async syncPlan(direction = 'both') {
    if (direction === 'pull' || direction === 'both') {
      printInfo(chalk.blue('📥 Pulling plan from server...'));
      this.requestPlan();
    }

    if (direction === 'push' || direction === 'both') {
      printInfo(chalk.blue('📤 Pushing local plan to server...'));
      try {
        const planPath = path.join(this.projectRoot, 'IMPLEMENTATION-PLAN.md');
        const planContent = await fs.readFile(planPath, 'utf8');

        this.sendMessage({
          type: 'plan_update',
          params: { content: planContent },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          printError(chalk.red(`❌ Failed to sync plan: ${error.message}`));
        }
      }
    }
  }

  /**
   * Sync project state with server
   */
  async syncState(direction = 'both') {
    if (direction === 'pull' || direction === 'both') {
      printInfo(chalk.blue('📥 Pulling state from server...'));
      this.requestState();
    }

    if (direction === 'push' || direction === 'both') {
      printInfo(chalk.blue('📤 Pushing local state to server...'));
      try {
        const statePath = path.join(this.projectRoot, '.ultra', 'state.json');
        const stateContent = await fs.readFile(statePath, 'utf8');
        const state = JSON.parse(stateContent);

        this.sendMessage({
          type: 'state_update',
          params: { state },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          printError(chalk.red(`❌ Failed to sync state: ${error.message}`));
        }
      }
    }
  }
}

/**
 * Create and connect a remote MCP client
 */
export async function createRemoteMCPClient(options = {}) {
  const client = new RemoteMCPClient(options);
  await client.connect();
  return client;
}

/**
 * Register the remote client command with Commander
 */
export function registerRemoteClientCommand(program) {
  program
    .command('mcp:connect')
    .description('Connect to remote MCP server for team sync')
    .option(
      '--server <url>',
      'Remote server URL (default: ws://localhost:4000)',
      'ws://localhost:4000'
    )
    .option('--api-key <key>', 'API key for authentication')
    .option('--project-root <path>', 'Project root directory', process.cwd())
    .option('--sync-context', 'Sync context with server')
    .option('--sync-plan', 'Sync implementation plan with server')
    .option('--sync-state', 'Sync project state with server')
    .option('--direction <direction>', 'Sync direction (pull, push, both)', 'both')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔗 Connecting to Remote MCP Server\n'));

        const clientOptions = {
          serverUrl: options.server,
          apiKey: options.apiKey,
          projectRoot: options.projectRoot,
        };

        const client = await createRemoteMCPClient(clientOptions);

        // Perform requested sync operations
        if (options.syncContext) {
          await client.syncContext(options.direction);
        }

        if (options.syncPlan) {
          await client.syncPlan(options.direction);
        }

        if (options.syncState) {
          await client.syncState(options.direction);
        }

        // Keep connection alive if syncing continuously
        if (options.syncContext || options.syncPlan || options.syncState) {
          printInfo(chalk.blue('\n🔄 Continuous sync enabled. Press Ctrl+C to disconnect.\n'));

          process.on('SIGINT', async () => {
            printInfo(chalk.yellow('\n⚠️  Disconnecting from remote MCP server...'));
            await client.disconnect();
            process.exit(0);
          });

          process.on('SIGTERM', async () => {
            printInfo(chalk.yellow('\n⚠️  Received SIGTERM, disconnecting...'));
            await client.disconnect();
            process.exit(0);
          });
        } else {
          printSuccess(chalk.green('✅ Connection established successfully'));
          await client.disconnect();
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Remote MCP connection failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  RemoteMCPClient,
  createRemoteMCPClient,
  registerRemoteClientCommand,
};
