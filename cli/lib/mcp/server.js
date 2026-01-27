import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";

export async function startMcpServer() {
  // Create server instance
  const server = new McpServer({
    name: "Ultra-Dex Active Kernel",
    version: "2.2.0"
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
