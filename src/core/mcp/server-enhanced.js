// Copyright (c) 2026 Ultra-Dex
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ppmManager } from '../memory/manager.js';
import { agentOrchestrator } from '../orchestration/index.js';

export class EnhancedMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ultra-dex-meta-layer',
        version: '6.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_memory',
          description: 'Query the Ultra-Dex tiered memory (Hot/Warm/Cold)',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              tier: { type: 'string', enum: ['hot', 'warm', 'cold'] },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_agent_status',
          description: 'Get the status of all active agents in the swarm',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'query_memory': {
          const results = await ppmManager.search(args.query);
          return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
        }

        case 'get_agent_status': {
          const sessions = agentOrchestrator.getActiveSessions();
          return { content: [{ type: 'text', text: JSON.stringify(sessions, null, 2) }] };
        }

        default:
          throw new Error('Tool not found');
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Ultra-Dex MCP Server running on Stdio');
  }
}

export const mcpServer = new EnhancedMCPServer();
