// Copyright (c) 2026 Ultra-Dex

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerResources } from './resources.js';
import { registerTools } from './tools.js';
import { registerUltraProtocol } from './protocol-handler.js';
import { initializeMcpHost, registerHostTools, mcpHub } from './host.js';
import { projectGraph } from './graph.js';
import { webSocketServer } from './websocket.js';
import { VERSION } from '../utils/version.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';
import { contextBus } from './context-bus.js';

/**
 * Creates and configures the MCP Server instance
 * @returns {McpServer} Configured MCP Server
 */
export function createMcpServer(options = {}) {
  const server = new McpServer(
    {
      name: 'Ultra-Dex Active Kernel',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
      },
    }
  );

  // Expose tools for internal orchestrator
  server.toolsMap = new Map();
  const originalTool = server.tool.bind(server);
  server.tool = (name, description, schema, handler, capability) => {
    server.toolsMap.set(name, { name, description, schema, handler });
    return originalTool(name, description, schema, handler, capability);
  };

  registerResources(server);
  registerTools(server);
  registerUltraProtocol(server);
  contextBus.register(server);

  if (options.hostMode) {
    registerHostTools(server, mcpHub);
  }

  return server;
}

/**
 * Starts the MCP Server in Stdio mode (for local usage/extensions)
 */
export async function startStdioServer(options = {}) {
  // Initialize Graph
  logger.debug('Initializing Ultra-Dex Active Kernel (Stdio)...');
  try {
    await projectGraph.scan();
    logger.debug(`Graph loaded: ${projectGraph.nodes.size} nodes.`);
  } catch (e) {
    logger.warn(`Graph initialization warning: ${e.message}`);
  }

  // Start WebSocket for side-channel updates
  try {
    await webSocketServer.start({ port: 3002 });
  } catch (error) {
    logger.error('WebSocket server failed', error);
  }

  if (options.hostMode) {
    await initializeMcpHost({ servers: options.servers || [] });
  }

  const server = createMcpServer({ hostMode: options.hostMode });
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.debug('Shutting down MCP server...');
    try {
      await webSocketServer.stop();
      await transport.close();
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.connect(transport);
    logger.debug('Ultra-Dex MCP Server running on Stdio...');
  } catch (err) {
    logger.error('Failed to connect MCP server', err);
    throw new AppError(`MCP Connection failed: ${err.message}`, { cause: err });
  }
}

// Legacy export for backward compatibility if needed, but we should use startStdioServer
export async function startMcpServer(options = {}) {
  if (options.transport === 'http') {
    throw new ValidationError(
      "Use 'ultra-dex serve' for HTTP mode. This function only supports Stdio or direct invocation."
    );
  }
  return startStdioServer();
}
