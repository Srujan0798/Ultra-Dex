import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";
import { projectGraph } from "./graph.js";
import { webSocketServer } from "./websocket.js";

export async function startMcpServer(options = {}) {
  const port = options.port || 3001;

  // Initialize Graph
  console.error("Initializing Ultra-Dex Active Kernel...");
  try {
    await projectGraph.scan();
    console.error(`Graph loaded: ${projectGraph.nodes.size} nodes, ${projectGraph.edges.length} edges.`);
  } catch (e) {
    console.error("Graph initialization warning:", e.message);
  }

  // Create server instance
  const server = new McpServer({
    name: "Ultra-Dex Active Kernel",
    version: "3.4.2"
  });

  // Register features
  registerResources(server);
  registerTools(server);

  // Start WebSocket server for real-time updates
  try {
    await webSocketServer.start({ port: 3002 });
    console.error("WebSocket server started on port 3002");
  } catch (error) {
    console.error("Failed to start WebSocket server:", error.message);
  }

  // Connect transport
  if (options.transport === 'http') {
    const transport = new HttpServerTransport({ port });
    await server.connect(transport);
    console.error(`Ultra-Dex MCP Server running on HTTP port ${port}...`);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Ultra-Dex MCP Server running on Stdio...");
  }

  // Note: Stdio transport takes over stdin/stdout, so no logging to console.log here!
  // Any logging must go to stderr
  console.error("Ultra-Dex Active Kernel initialized with MCP + WebSocket...");
}
