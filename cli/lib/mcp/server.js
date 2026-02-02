import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";
import { projectGraph } from "./graph.js";
import { webSocketServer } from "./websocket.js";
import { VERSION } from "../utils/version.js";

/**
 * Creates and configures the MCP Server instance
 * @returns {McpServer} Configured MCP Server
 */
export function createMcpServer() {
  const server = new Server(
    {
      name: "Ultra-Dex Active Kernel",
      version: VERSION
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    }
  );

  registerResources(server);
  registerTools(server);

  return server;
}

/**
 * Starts the MCP Server in Stdio mode (for local usage/extensions)
 */
export async function startStdioServer() {
  // Initialize Graph
  console.error("Initializing Ultra-Dex Active Kernel (Stdio)...");
  try {
    await projectGraph.scan();
    console.error(`Graph loaded: ${projectGraph.nodes.size} nodes.`);
  } catch (e) {
    console.error("Graph initialization warning:", e.message);
  }

  // Start WebSocket for side-channel updates
  try {
    await webSocketServer.start({ port: 3002 });
  } catch (error) {
    console.error("WebSocket server failed:", error.message);
  }

  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Ultra-Dex MCP Server running on Stdio...");
}

// Legacy export for backward compatibility if needed, but we should use startStdioServer
export async function startMcpServer(options = {}) {
  if (options.transport === 'http') {
    throw new Error("Use 'ultra-dex serve' for HTTP mode. This function only supports Stdio or direct invocation.");
  }
  return startStdioServer();
}