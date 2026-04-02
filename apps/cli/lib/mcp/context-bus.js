// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Context Bus
 * Standard protocol for context sharing between tools
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { glob } from 'glob';
import { Logger } from '../utils/logger.js';

const logger = new Logger({ prefix: 'ContextBus' });

// Context bus singleton
class ContextBus extends EventEmitter {
  constructor() {
    super();
    this.context = new Map();
    this.subscribers = new Set();
    this.server = null;
    this.wss = null;
    this.port = 3003; // Default MCP context bus port

    // Initialize with default context
    this.initializeDefaultContext();
  }

  /**
   * Initialize default context
   */
  async initializeDefaultContext() {
    try {
      // Load CONTEXT.md if it exists
      const contextPath = path.join(process.cwd(), 'CONTEXT.md');
      const contextContent = await fs.readFile(contextPath, 'utf8');

      this.context.set('project.context', {
        content: contextContent,
        timestamp: new Date().toISOString(),
        source: 'CONTEXT.md',
      });
    } catch (error) {
      // CONTEXT.md doesn't exist, that's OK
      this.context.set('project.context', {
        content: '# Project Context\n\nNo context defined yet.',
        timestamp: new Date().toISOString(),
        source: 'default',
      });
    }
  }

  /**
   * Publish context update
   */
  publish(key, value, metadata = {}) {
    const contextUpdate = {
      key,
      value,
      timestamp: new Date().toISOString(),
      metadata,
      source: metadata.source || 'ultra-dex',
    };

    this.context.set(key, contextUpdate);

    // Emit to local subscribers
    this.emit('context-update', contextUpdate);

    // Broadcast to connected MCP clients if server is running
    if (this.wss) {
      const message = JSON.stringify({
        type: 'context-update',
        data: contextUpdate,
      });

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocketServer.OPEN) {
          client.send(message);
        }
      });
    }

    logger.info(`Published ${key}`);
  }

  /**
   * Subscribe to context updates
   */
  subscribe(callback) {
    this.on('context-update', callback);
    this.subscribers.add(callback);

    return () => {
      this.removeListener('context-update', callback);
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get context value
   */
  get(key) {
    return this.context.get(key);
  }

  /**
   * Get all context
   */
  getAll() {
    return Object.fromEntries(this.context);
  }

  /**
   * Start MCP context server
   */
  async startServer(port = null) {
    if (this.server) {
      logger.warn('Server already running');
      return;
    }

    this.port = port || this.port;

    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws) => {
      logger.info('New MCP client connected');

      // Send current context to new client
      const currentContext = this.getAll();
      ws.send(
        JSON.stringify({
          type: 'initial-context',
          data: currentContext,
        })
      );

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'context-request') {
            // Client is requesting specific context
            const requestedContext = this.get(data.key);
            ws.send(
              JSON.stringify({
                type: 'context-response',
                key: data.key,
                data: requestedContext,
              })
            );
          } else if (data.type === 'context-update') {
            // Client is updating context
            this.publish(data.key, data.value, data.metadata);
          }
        } catch (error) {
          logger.error(`Error processing message: ${error.message}`);
        }
      });

      ws.on('close', () => {
        logger.info('MCP client disconnected');
      });
    });

    this.server.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
    });
  }

  /**
   * Stop MCP context server
   */
  async stopServer() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    logger.info('Server stopped');
  }

  /**
   * Sync context with external tools
   */
  async syncWithExternalTools() {
    // Sync with CONTEXT.md
    await this.syncWithContextMd();

    // Sync with other potential context sources
    await this.syncWithImplementationPlan();
    await this.syncWithState();
  }

  /**
   * Sync with CONTEXT.md file
   */
  async syncWithContextMd() {
    try {
      const contextPath = path.join(process.cwd(), 'CONTEXT.md');
      const content = await fs.readFile(contextPath, 'utf8');

      // Only update if content has changed
      const currentValue = this.get('project.context');
      if (!currentValue || currentValue.value !== content) {
        this.publish('project.context', content, {
          source: 'CONTEXT.md',
          sync: true,
        });
      }
    } catch (error) {
      // CONTEXT.md doesn't exist, that's OK
    }
  }

  /**
   * Sync with IMPLEMENTATION-PLAN.md
   */
  async syncWithImplementationPlan() {
    try {
      const planPath = path.join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
      const content = await fs.readFile(planPath, 'utf8');

      this.publish('project.plan', content, {
        source: 'IMPLEMENTATION-PLAN.md',
        sync: true,
      });
    } catch (error) {
      // IMPLEMENTATION-PLAN.md doesn't exist, that's OK
    }
  }

  /**
   * Sync with state.json
   */
  async syncWithState() {
    try {
      const statePaths = [
        path.join(process.cwd(), '.ultra', 'state.json'),
        path.join(process.cwd(), 'state.json'),
        path.join(process.cwd(), '.ultra-dex', 'state.json'),
      ];

      for (const statePath of statePaths) {
        try {
          const content = await fs.readFile(statePath, 'utf8');
          const state = JSON.parse(content);

          this.publish('project.state', state, {
            source: statePath,
            sync: true,
          });

          break; // Found and processed one
        } catch (err) {
          // Try next path
          continue;
        }
      }
    } catch (error) {
      // No state file found, that's OK
    }
  }

  /**
   * Watch for context changes
   */
  async startWatching() {
    // Watch for changes to context files
    const chokidar = await import('chokidar');

    const watcher = chokidar.watch(
      [
        'CONTEXT.md',
        'IMPLEMENTATION-PLAN.md',
        '.ultra/state.json',
        '.ultra-dex/state.json',
        'state.json',
      ],
      {
        cwd: process.cwd(),
        ignoreInitial: true,
      }
    );

    watcher.on('change', async (filePath) => {
      logger.info(`Detected change in ${filePath}`);

      try {
        await this.syncWithExternalTools();
      } catch (error) {
        logger.error(`Error syncing after change: ${error.message}`);
      }
    });

    return watcher;
  }

  /**
   * Register context bus resources with an MCP server
   */
  register(server) {
    if (!server?.resource) return;

    try {
      server.resource('context_bus', 'ultradex://context-bus', async (uri) => {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(this.getAll(), null, 2),
            },
          ],
        };
      });
    } catch (error) {
      // Avoid crashing server on duplicate registration
      logger.warn(`Resource registration skipped: ${error.message}`);
    }
  }
}

// Singleton instance
const contextBus = new ContextBus();

/**
 * Register context bus command
 */
export function registerContextBusCommand(program) {
  const busCmd = program
    .command('context-bus')
    .alias('mcp-context')
    .description('MCP context sharing protocol');

  busCmd
    .command('start')
    .description('Start context bus server')
    .option('-p, --port <port>', 'Port to run server on', '3003')
    .action(async (options) => {
      try {
        logger.info('Starting MCP Context Bus server...');
        await contextBus.startServer(parseInt(options.port));

        // Keep process alive
        await new Promise(() => {});
      } catch (error) {
        logger.error(`Error starting context bus: ${error.message}`);
      }
    });

  busCmd
    .command('publish')
    .description('Publish context to bus')
    .argument('<key>', 'Context key')
    .argument('<value>', 'Context value')
    .option('-m, --metadata <json>', 'Additional metadata as JSON')
    .action(async (key, value, options) => {
      try {
        let metadata = {};
        if (options.metadata) {
          metadata = JSON.parse(options.metadata);
        }

        contextBus.publish(key, value, metadata);
        logger.success(`Published to context bus: ${key}`);
      } catch (error) {
        logger.error(`Error publishing to context bus: ${error.message}`);
      }
    });

  busCmd
    .command('get')
    .description('Get context from bus')
    .argument('<key>', 'Context key')
    .action((key) => {
      try {
        const value = contextBus.get(key);
        if (value) {
          logger.info(JSON.stringify(value, null, 2));
        } else {
          logger.info(`Context key '${key}' not found`);
        }
      } catch (error) {
        logger.error(`Error getting context: ${error.message}`);
      }
    });

  busCmd
    .command('list')
    .description('List all context keys')
    .action(() => {
      try {
        const allContext = contextBus.getAll();
        logger.info('Context keys:');
        for (const [key] of Object.entries(allContext)) {
          logger.info(`- ${key}`);
        }
      } catch (error) {
        logger.error(`Error listing context: ${error.message}`);
      }
    });

  busCmd
    .command('sync')
    .description('Sync context with external files')
    .action(async () => {
      try {
        logger.info('Syncing context with external files...');
        await contextBus.syncWithExternalTools();
        logger.success('Context sync complete');
      } catch (error) {
        logger.error(`Error syncing context: ${error.message}`);
      }
    });

  busCmd
    .command('watch')
    .description('Watch for context changes')
    .action(async () => {
      try {
        logger.info('Watching for context changes...');
        await contextBus.startWatching();

        // Keep process alive
        await new Promise(() => {});
      } catch (error) {
        logger.error(`Error watching context: ${error.message}`);
      }
    });

  busCmd._examples = [
    { command: 'ultra-dex context-bus start', description: 'Start context bus server' },
    {
      command: 'ultra-dex context-bus publish project.name "My App"',
      description: 'Publish context to bus',
    },
    { command: 'ultra-dex context-bus get project.name', description: 'Get context from bus' },
    { command: 'ultra-dex context-bus sync', description: 'Sync context with files' },
    { command: 'ultra-dex context-bus watch', description: 'Watch for context changes' },
  ];
}

export { contextBus };

export default {
  contextBus,
  registerContextBusCommand,
};
