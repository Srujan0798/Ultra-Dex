import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";
import { projectGraph } from "./graph.js";

export async function startMcpServer() {
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
    version: "3.3.0"
  });

  // Register features
  registerResources(server);
  registerTools(server);

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Note: Stdio transport takes over stdin/stdout, so no logging to console.log here!
  // Any logging must go to stderr
  console.error("Ultra-Dex MCP Server running on Stdio...");
}
