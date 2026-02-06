// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Host Mode
 * Connects to external MCP servers and exposes a unified tool registry.
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { mcpHub, listAvailableServers } from './client.js';
import { logger } from '../ui/logger.js';

const DEFAULT_HOST_CONFIG = '.ultra-dex/mcp-host.json';

async function loadHostConfig() {
  const envServers = process.env.ULTRA_DEX_MCP_SERVERS;
  if (envServers) {
    return envServers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  try {
    const configPath = path.resolve(process.cwd(), DEFAULT_HOST_CONFIG);
    const content = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(content);
    if (Array.isArray(config.servers)) {
      return config.servers;
    }
    if (Array.isArray(config.mcpServers)) {
      return config.mcpServers;
    }
  } catch {
    // Ignore missing config
  }

  return [];
}

export async function initializeMcpHost(options = {}) {
  const servers = options.servers?.length ? options.servers : await loadHostConfig();
  const connected = [];
  const failures = [];

  if (servers.length === 0) {
    // Attempt to restore previously connected state
    const restored = await mcpHub.restoreState();
    return { connected: restored, failures, restored: true };
  }

  for (const server of servers) {
    try {
      await mcpHub.connect(server);
      connected.push(server);
    } catch (error) {
      failures.push({ server, error: error.message });
    }
  }

  try {
    await mcpHub.saveState();
  } catch (error) {
    logger.debug(`Failed to persist MCP host state: ${error.message}`);
  }

  return { connected, failures, restored: false };
}

export function registerHostTools(server) {
  server.tool('mcp_list_servers', 'List available MCP servers and their status', {}, async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              available: listAvailableServers(),
              connected: mcpHub.getStatus(),
            },
            null,
            2
          ),
        },
      ],
    };
  });

  server.tool(
    'mcp_connect',
    'Connect to an MCP server by name',
    {
      server: z.string().describe('Server name (e.g., github, filesystem)'),
    },
    async ({ server: serverName }) => {
      try {
        await mcpHub.connect(serverName);
        await mcpHub.saveState();
        return { content: [{ type: 'text', text: `Connected to ${serverName}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Failed to connect: ${error.message}` }] };
      }
    }
  );

  server.tool(
    'mcp_disconnect',
    'Disconnect from an MCP server',
    {
      server: z.string().describe('Server name to disconnect'),
    },
    async ({ server: serverName }) => {
      await mcpHub.disconnect(serverName);
      await mcpHub.saveState();
      return { content: [{ type: 'text', text: `Disconnected from ${serverName}` }] };
    }
  );

  server.tool('mcp_list_tools', 'List all tools across connected MCP servers', {}, async () => {
    const tools = mcpHub.listAllTools();
    return {
      content: [{ type: 'text', text: JSON.stringify(tools, null, 2) }],
    };
  });

  server.tool(
    'mcp_call_tool',
    'Invoke a tool exposed by a connected MCP server',
    {
      server: z.string().describe('Server name'),
      tool: z.string().describe('Tool name'),
      arguments: z.record(z.any()).optional().describe('Tool arguments'),
    },
    async ({ server: serverName, tool, arguments: args }) => {
      try {
        const result = await mcpHub.callTool(serverName, tool, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Tool call failed: ${error.message}` }] };
      }
    }
  );

  server.tool(
    'mcp_list_resources',
    'List all resources across connected MCP servers',
    {},
    async () => {
      const resources = mcpHub.listAllResources();
      return {
        content: [{ type: 'text', text: JSON.stringify(resources, null, 2) }],
      };
    }
  );

  server.tool(
    'mcp_read_resource',
    'Read a resource from a connected MCP server',
    {
      server: z.string().describe('Server name'),
      uri: z.string().describe('Resource URI'),
    },
    async ({ server: serverName, uri }) => {
      try {
        const result = await mcpHub.readResource(serverName, uri);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Resource read failed: ${error.message}` }] };
      }
    }
  );
}

export { mcpHub };
