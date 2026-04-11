/**
 * @ultra-dex/mcp-server
 *
 * Model Context Protocol (MCP) server for Ultra-Dex.
 * Exposes Ultra-Dex capabilities as MCP tools for AI assistants.
 */

import { EventEmitter } from 'events';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  read: () => Promise<string | Buffer>;
}

export interface MCPServerOptions {
  name: string;
  version: string;
  tools?: MCPTool[];
  resources?: MCPResource[];
}

export class MCPServer extends EventEmitter {
  private name: string;
  private version: string;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private running: boolean = false;

  constructor(options: MCPServerOptions) {
    super();
    this.name = options.name;
    this.version = options.version;

    for (const tool of options.tools || []) {
      this.registerTool(tool);
    }
    for (const resource of options.resources || []) {
      this.registerResource(resource);
    }
  }

  /**
   * Register an MCP tool.
   */
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register an MCP resource.
   */
  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  /**
   * Call a tool by name with arguments.
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
    }
    return tool.handler(args);
  }

  /**
   * Read a resource by URI.
   */
  async readResource(uri: string): Promise<string | Buffer> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource "${uri}" not found. Available resources: ${Array.from(this.resources.keys()).join(', ')}`);
    }
    return resource.read();
  }

  /**
   * List all registered tools.
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * List all registered resources.
   */
  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get server info.
   */
  getInfo(): { name: string; version: string; toolCount: number; resourceCount: number } {
    return {
      name: this.name,
      version: this.version,
      toolCount: this.tools.size,
      resourceCount: this.resources.size,
    };
  }

  /**
   * Start the server.
   */
  async start(): Promise<void> {
    this.running = true;
    this.emit('started', this.getInfo());
  }

  /**
   * Stop the server.
   */
  async stop(): Promise<void> {
    this.running = false;
    this.emit('stopped');
  }

  /**
   * Check if server is running.
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Create default Ultra-Dex MCP tools.
 */
export function createUltraDexTools(ultraDex: any): MCPTool[] {
  return [
    {
      name: 'ultra_dex_run',
      description: 'Execute an AI task through Ultra-Dex',
      inputSchema: {
        type: 'object',
        properties: {
          agent: { type: 'string', description: 'Agent role to execute' },
          task: { type: 'string', description: 'Task description' },
          provider: { type: 'string', description: 'AI provider to use' },
        },
        required: ['agent', 'task'],
      },
      handler: async (args: Record<string, unknown>) => {
        return ultraDex.run({
          agent: args.agent,
          task: args.task,
          provider: args.provider,
        });
      },
    },
    {
      name: 'ultra_dex_swarm',
      description: 'Run a multi-agent swarm workflow',
      inputSchema: {
        type: 'object',
        properties: {
          feature: { type: 'string', description: 'Feature description for the swarm' },
          maxSteps: { type: 'number', description: 'Maximum steps' },
        },
        required: ['feature'],
      },
      handler: async (args: Record<string, unknown>) => {
        return ultraDex.swarm(args.feature, { maxSteps: args.maxSteps });
      },
    },
    {
      name: 'ultra_dex_health',
      description: 'Check Ultra-Dex system health',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        return { status: 'ok', version: '3.1.0' };
      },
    },
  ];
}

export const mcpServer = new MCPServer({
  name: 'ultra-dex',
  version: '3.1.0',
});
